# BUILD.md — EtsyGuard MVP
### Etsy Listing Copy Detection & IP Protection Tool

---

## 🧭 What We're Building

A SaaS tool that automatically monitors Etsy for copied listings (titles + images), alerts the seller, and helps them take action fast. Built for indie launch, Reddit distribution, and fast iteration.

**Target user:** Etsy sellers with 10–200+ listings who've been copied before or are scared of it happening. Especially print-on-demand and digital download sellers.

**MVP goal:** Get 50 paying users at $15/mo within 60 days of launch.

---

## 🏗️ Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend + Backend | Lovable (React + Supabase) | Fast to ship, no DevOps |
| Database | Supabase (Postgres) | Auth + DB + Edge Functions |
| Background Jobs | Supabase Edge Functions + pg_cron | Scheduled scanning |
| Title Matching | Fuse.js (client) / custom fuzzy logic (edge fn) | Lightweight, no extra service |
| Image Hashing | pHash via Sharp (Node) in Edge Function | Perceptual hash comparison |
| Image Reverse Search | Google Vision API (optional, phase 2) | Cost-controlled |
| Email Alerts | Resend | Simple, reliable |
| Payments | Stripe | Standard |
| Etsy Integration | Etsy OAuth2 + REST API v3 | Official, TOS-compliant |

---

## 📦 MVP Feature Scope

### ✅ MUST HAVE (MVP)
1. **Etsy OAuth connect** — seller connects their shop securely
2. **Listing import** — pull all active listings (title + primary image URL)
3. **Title scan** — fuzzy match your titles against all Etsy search results for those keywords
4. **Image scan** — perceptual hash your images, compare against search results
5. **Match dashboard** — show flagged listings with similarity score + link to the suspected copy
6. **Email alert** — instant notification when a new match is found
7. **Report helper** — pre-filled Etsy IP report link for each flagged match
8. **Scan schedule** — auto re-scan every 24 hours per user
9. **Stripe billing** — $15/mo subscription, 7-day free trial

### 🔜 POST-MVP (v1.1)
- Cease & desist message generator (AI-written, one click)
- Match history + tracking (was it removed after reporting?)
- Slack / Discord webhook alerts
- Multi-shop support
- Bulk report submission

### ❌ OUT OF SCOPE FOR MVP
- Cross-platform scanning (eBay, Amazon, etc.)
- Real-time scanning (too expensive, daily is enough)
- Legal advice or filing services

---

## 🗄️ Database Schema

```sql
-- Users (handled by Supabase Auth)

-- Connected Etsy shops
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  etsy_shop_id TEXT NOT NULL,
  shop_name TEXT,
  access_token TEXT,           -- encrypted
  refresh_token TEXT,          -- encrypted
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_scan_at TIMESTAMPTZ
);

-- Imported listings from seller's shop
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id),
  etsy_listing_id TEXT NOT NULL,
  title TEXT,
  image_url TEXT,
  image_hash TEXT,             -- pHash fingerprint
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detected matches (suspected copies)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  shop_id UUID REFERENCES shops(id),
  suspected_etsy_listing_id TEXT,
  suspected_shop_name TEXT,
  suspected_listing_url TEXT,
  suspected_title TEXT,
  suspected_image_url TEXT,
  match_type TEXT CHECK (match_type IN ('title', 'image', 'both')),
  title_similarity FLOAT,      -- 0.0 to 1.0
  image_similarity FLOAT,      -- 0.0 to 1.0
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'reported', 'resolved', 'dismissed')),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  reported_at TIMESTAMPTZ
);

-- Scan job log
CREATE TABLE scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  listings_scanned INT DEFAULT 0,
  matches_found INT DEFAULT 0,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT
);

-- Subscriptions (sync from Stripe webhook)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,                 -- 'trialing', 'active', 'canceled', etc.
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
);
```

---

## 🔌 Etsy API Integration

### OAuth2 Flow
```
1. User clicks "Connect Etsy Shop"
2. Redirect to: https://www.etsy.com/oauth/connect
   Scopes needed: listings_r (read listings)
3. Etsy redirects back with auth code
4. Exchange code for access_token + refresh_token
5. Store encrypted tokens in shops table
6. Pull shop info + all active listings
```

### Key API Endpoints Used
```
GET /v3/application/shops/{shop_id}          — shop info
GET /v3/application/shops/{shop_id}/listings/active  — all active listings
GET /v3/application/listings/active?keywords={term}  — search by keyword (for matching)
```

### Rate Limit Strategy
- Etsy allows ~10 requests/second per OAuth token
- For scanning: batch requests with 100ms delay between calls
- For 100-listing shop: full title scan takes ~3-5 min, run overnight
- Cache search results for 12h to avoid redundant calls

---

## 🔍 Matching Logic

### Title Matching Algorithm
```javascript
// Using Fuse.js with these settings
const fuseOptions = {
  includeScore: true,
  threshold: 0.25,        // Lower = stricter match
  minMatchCharLength: 10,
  keys: ['title']
};

// Flag as suspicious if similarity score > 0.75
// Flag as likely copy if similarity score > 0.88
```

**What gets flagged:**
- "Personalized Dog Name Necklace Sterling Silver" vs "Personalized Dog Name Necklace Sterling Silver Custom" → 🚨 Likely copy
- "Boho Wedding Invitation Template Editable" vs "Bohemian Wedding Invitation Editable Template" → ⚠️ Suspicious
- General keyword overlap → Ignored (too many false positives)

### Image Matching Algorithm
```javascript
// Perceptual hashing with Sharp
// 1. Resize image to 8x8 px
// 2. Convert to grayscale  
// 3. Generate 64-bit hash
// 4. Compare Hamming distance between hashes

// Hamming distance thresholds:
// 0-5:   Almost certainly the same image 🚨
// 6-10:  Very similar, likely copied ⚠️
// 11-15: Similar but could be coincidence
// 16+:   Different images, ignore
```

### Scanning Strategy Per Listing
```
For each seller listing:
  1. Take top 3 keywords from title
  2. Search Etsy API: GET /listings/active?keywords={keywords}&limit=100
  3. For each result:
     a. Run title fuzzy match → score
     b. If score > 0.6: download their primary image, compute pHash
     c. Compare image hash → Hamming distance
  4. If title_score > 0.75 OR image_distance < 10 → create match record
  5. Skip if same shop_id (don't flag your own listings)
```

---

## 📱 Page Structure (Lovable)

```
/                       Landing page (SEO + conversion)
/signup                 Email + password or Google auth
/onboarding             Connect Etsy shop (OAuth flow)
/dashboard              Overview: shops, scan status, alert count
/matches                All flagged listings with filters
/matches/:id            Single match detail + action buttons
/listings               Your imported listings
/settings               Account, notifications, billing
/billing                Stripe checkout + plan management
```

### Dashboard Key Metrics (above the fold)
- Total listings monitored
- Active matches found
- Last scan time + next scan time
- "Scan Now" manual trigger button

### Match Card UI
```
[LIKELY COPY 🚨]                    [SUSPICIOUS ⚠️]

Your listing:                       Suspected copy:
[image]  "Personalized Dog..."      [image]  "Personalized Dog..."
                                    Shop: CopyCatCrafts
Title similarity: 94%               Listed: 3 days ago
Image similarity: 97%

[ View on Etsy ] [ Report to Etsy ] [ Dismiss ] [ Mark Resolved ]
```

---

## ⚡ Edge Functions (Supabase)

```
/functions/
  etsy-oauth-callback/    Handle OAuth redirect, store tokens
  import-listings/        Pull all listings from connected shop
  scan-shop/              Run full scan for one shop
  send-alert/             Send email via Resend when match found
  stripe-webhook/         Handle payment events
  refresh-token/          Auto-refresh expired Etsy tokens
```

### Cron Schedule (pg_cron)
```sql
-- Scan all active shops once per day at 2am UTC
SELECT cron.schedule(
  'daily-scan',
  '0 2 * * *',
  $$SELECT scan_all_shops()$$
);
```

---

## 📧 Email Alerts (Resend)

**Trigger:** New match with similarity > 0.80

**Subject:** `🚨 Possible copy of your listing detected on Etsy`

**Body includes:**
- Your listing title + thumbnail
- Suspected copy title + thumbnail + shop link
- Similarity score
- Direct link to EtsyGuard match page
- One-click "Report to Etsy" button (pre-filled URL)

---

## 💳 Pricing & Stripe Setup

```
Free Trial:  7 days, full access, no credit card required
Solo Plan:   $15/mo — 1 shop, up to 200 listings, daily scans, email alerts
Pro Plan:    $29/mo — 3 shops, unlimited listings, priority scans, Slack alerts
```

**Stripe products to create:**
- `price_solo_monthly` — $15/mo recurring
- `price_pro_monthly` — $29/mo recurring

---

## 🚀 Build Phases

### Phase 1 — Core (Weeks 1–2)
- [ ] Supabase project setup + schema migration
- [ ] Lovable project init + auth (email + Google)
- [ ] Etsy OAuth connect flow (edge function)
- [ ] Listing import from Etsy API
- [ ] Basic dashboard showing imported listings

### Phase 2 — Detection (Weeks 3–4)
- [ ] Title fuzzy matching logic (Fuse.js)
- [ ] pHash image fingerprinting (Sharp in edge fn)
- [ ] Scan job runner (manual trigger first)
- [ ] Matches table + match card UI
- [ ] Match status actions (dismiss, report, resolved)

### Phase 3 — Alerts + Billing (Week 5)
- [ ] Resend email alert on new match
- [ ] Stripe integration (checkout + webhooks)
- [ ] 7-day free trial flow
- [ ] pg_cron daily scan scheduler

### Phase 4 — Polish + Launch (Week 6)
- [ ] Landing page (clear value prop, social proof placeholder)
- [ ] Onboarding flow (connect shop → first scan → first result)
- [ ] Error states + empty states
- [ ] Rate limit handling + retry logic
- [ ] Reddit launch post + Product Hunt draft

---

## 🧪 Testing Before Launch

- Connect your own Etsy shop (or a test shop)
- Manually create a duplicate listing in a second test account
- Verify it gets flagged within 24h scan cycle
- Trigger manual scan → confirm email arrives
- Run Stripe test checkout → confirm subscription activates
- Test token refresh (Etsy tokens expire in 3600s)

---

## ⚠️ Known Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Etsy API rate limits | Batch with delays, cache results, queue overnight |
| Etsy revokes API access | Stay 100% within TOS, no scraping, use official API only |
| High false positive rate | Tune similarity thresholds after real user feedback |
| Image CDN costs | Only hash images of high-similarity title matches first |
| Etsy changes API | Abstract API calls into one service layer |

---

## 📣 Reddit Launch Strategy

**Target subreddits:**
- r/Etsy (900k members)
- r/EtsySellers
- r/printondemand
- r/digitalnomad (secondary)

**Post angle:** Don't pitch the tool. Tell the story.

> "I got fed up watching my Etsy designs get stolen with zero way to find out. So I built a tool that scans Etsy every day and emails you when someone copies your listing. It's free to try — would love feedback from sellers who've dealt with this."

Add screenshots of a real match being detected. That's the hook.

---

## 📏 MVP Success Metrics

| Metric | Target at 30 days |
|---|---|
| Signups | 200 |
| Shops connected | 100 |
| Paying subscribers | 30 |
| MRR | $450 |
| Matches detected (real) | 50+ |
| Churn rate | < 10% |

---

*Built with Lovable + Supabase + Etsy API v3*
