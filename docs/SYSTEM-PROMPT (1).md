# SYSTEM PROMPT — EtsyGuard
### For use with Lovable, Cursor, VS Code + Copilot, or Google Project IDX

---

## 🧠 Project Identity

You are building **EtsyGuard** — a SaaS tool that helps Etsy sellers detect when their listings (titles and images) have been copied by other sellers. The tool connects to a seller's Etsy shop via OAuth, imports their listings, runs daily scans across Etsy search results, and alerts them by email when suspicious matches are found.

The stack is:
- **Frontend:** React (via Lovable), Tailwind CSS, shadcn/ui components
- **Backend:** Supabase (Postgres + Auth + Edge Functions + pg_cron)
- **Payments:** Stripe (subscriptions + webhooks)
- **Email:** Resend
- **External API:** Etsy REST API v3 (OAuth2)
- **Image processing:** Sharp (pHash perceptual hashing) inside Supabase Edge Functions
- **Title matching:** Fuse.js fuzzy search

---

## 🎯 Core Principles

1. **Ship working code, not perfect code.** This is an MVP. Prioritize features that prove value to the user over architectural elegance.

2. **Never scrape Etsy.** All Etsy data must come through the official Etsy API v3. No HTML scraping, no undocumented endpoints. The app depends on staying in Etsy's good graces.

3. **Protect user tokens.** Etsy OAuth tokens must always be stored encrypted. Never log or expose them in responses or client-side code.

4. **False positives are worse than false negatives early on.** When in doubt, raise the similarity threshold rather than spam users with bad alerts. Trust is the most important early metric.

5. **Every feature should answer: does this help a seller take action?** If it's just informational without a next step, deprioritize it.

---

## 📁 Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui base components
│   │   ├── dashboard/             # Dashboard-specific components
│   │   ├── matches/               # Match cards, match detail
│   │   ├── listings/              # Listing grid/list view
│   │   ├── onboarding/            # Connect shop flow
│   │   └── layout/                # Nav, sidebar, shell
│   ├── pages/
│   │   ├── index.tsx              # Landing page
│   │   ├── dashboard.tsx
│   │   ├── matches.tsx
│   │   ├── matches/[id].tsx
│   │   ├── listings.tsx
│   │   ├── settings.tsx
│   │   └── billing.tsx
│   ├── hooks/
│   │   ├── useShop.ts
│   │   ├── useMatches.ts
│   │   ├── useListings.ts
│   │   └── useSubscription.ts
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client
│   │   ├── stripe.ts              # Stripe helpers
│   │   ├── etsy.ts                # Etsy API wrapper
│   │   └── fuzzy.ts               # Fuse.js title matching
│   └── types/
│       └── index.ts               # Shared TypeScript types
├── supabase/
│   ├── migrations/                # SQL schema files
│   └── functions/
│       ├── etsy-oauth-callback/
│       ├── import-listings/
│       ├── scan-shop/
│       ├── send-alert/
│       ├── stripe-webhook/
│       └── refresh-etsy-token/
└── public/
```

---

## 🗄️ Database Types (TypeScript)

```typescript
export type Shop = {
  id: string;
  user_id: string;
  etsy_shop_id: string;
  shop_name: string;
  access_token: string;       // encrypted at rest
  refresh_token: string;      // encrypted at rest
  token_expires_at: string;
  connected_at: string;
  last_scan_at: string | null;
};

export type Listing = {
  id: string;
  shop_id: string;
  etsy_listing_id: string;
  title: string;
  image_url: string;
  image_hash: string | null;  // pHash fingerprint
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  listing_id: string;
  shop_id: string;
  suspected_etsy_listing_id: string;
  suspected_shop_name: string;
  suspected_listing_url: string;
  suspected_title: string;
  suspected_image_url: string;
  match_type: 'title' | 'image' | 'both';
  title_similarity: number;   // 0.0 to 1.0
  image_similarity: number;   // 0.0 to 1.0
  status: 'new' | 'reviewing' | 'reported' | 'resolved' | 'dismissed';
  detected_at: string;
  reported_at: string | null;
};

export type MatchWithListing = Match & {
  listing: Listing;
};

export type ScanLog = {
  id: string;
  shop_id: string;
  started_at: string;
  completed_at: string | null;
  listings_scanned: number;
  matches_found: number;
  status: 'running' | 'completed' | 'failed';
  error_message: string | null;
};

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  trial_ends_at: string | null;
  current_period_end: string;
};
```

---

## 🔌 Etsy API Patterns

### Always use this wrapper — never call Etsy directly from components:

```typescript
// lib/etsy.ts

const ETSY_BASE = 'https://openapi.etsy.com/v3';

export async function etsyGet(
  endpoint: string,
  accessToken: string,
  params?: Record<string, string>
) {
  const url = new URL(`${ETSY_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'x-api-key': process.env.ETSY_API_KEY!,
    },
  });

  if (res.status === 401) throw new Error('ETSY_TOKEN_EXPIRED');
  if (res.status === 429) throw new Error('ETSY_RATE_LIMITED');
  if (!res.ok) throw new Error(`ETSY_ERROR_${res.status}`);

  return res.json();
}

// Fetch all active listings for a shop (handles pagination)
export async function getShopListings(shopId: string, accessToken: string) {
  const listings = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const data = await etsyGet(
      `/application/shops/${shopId}/listings/active`,
      accessToken,
      { limit: String(limit), offset: String(offset) }
    );

    listings.push(...data.results);

    if (data.results.length < limit) break;
    offset += limit;

    // Respect rate limits
    await new Promise(r => setTimeout(r, 150));
  }

  return listings;
}

// Search Etsy by keyword
export async function searchListings(keywords: string, accessToken: string) {
  return etsyGet('/application/listings/active', accessToken, {
    keywords,
    limit: '100',
    sort_on: 'score',
  });
}
```

---

## 🔍 Matching Logic

### Title Matching (Fuse.js)

```typescript
// lib/fuzzy.ts
import Fuse from 'fuse.js';

export function getTitleSimilarity(titleA: string, titleB: string): number {
  // Normalize: lowercase, remove punctuation
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  const a = normalize(titleA);
  const b = normalize(titleB);

  // Fuse.js match — score is 0 (perfect) to 1 (no match), invert it
  const fuse = new Fuse([{ title: b }], {
    includeScore: true,
    threshold: 1.0,
    keys: ['title'],
  });

  const result = fuse.search(a);
  if (!result.length || result[0].score === undefined) return 0;

  return 1 - result[0].score;
}

// Thresholds to use when creating matches:
export const TITLE_THRESHOLDS = {
  LIKELY_COPY: 0.88,      // Red alert
  SUSPICIOUS: 0.72,       // Yellow alert
  IGNORE: 0.72,           // Below this: skip
};
```

### Image Hashing (Edge Function, Sharp)

```typescript
// Inside scan-shop edge function
import sharp from 'npm:sharp';

async function computePHash(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    const pixels = await sharp(Buffer.from(buffer))
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    // Compute average pixel value
    const avg = pixels.reduce((sum, p) => sum + p, 0) / pixels.length;

    // Build binary hash string
    const hash = Array.from(pixels)
      .map(p => (p >= avg ? '1' : '0'))
      .join('');

    return hash;
  } catch {
    return null;
  }
}

function hammingDistance(hashA: string, hashB: string): number {
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) distance++;
  }
  return distance;
}

// Convert to 0-1 similarity score
function imageHashSimilarity(hashA: string, hashB: string): number {
  const distance = hammingDistance(hashA, hashB);
  return 1 - distance / 64;
}

// Thresholds:
// similarity > 0.92 = almost certainly same image (distance < 5)
// similarity > 0.84 = very similar (distance < 10)
```

---

## 📧 Email Alert (Resend)

```typescript
// functions/send-alert/index.ts
import { Resend } from 'npm:resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

export async function sendMatchAlert(params: {
  toEmail: string;
  yourTitle: string;
  yourImageUrl: string;
  suspectedTitle: string;
  suspectedImageUrl: string;
  suspectedShopName: string;
  suspectedListingUrl: string;
  titleSimilarity: number;
  matchId: string;
  appUrl: string;
}) {
  await resend.emails.send({
    from: 'EtsyGuard <alerts@etsyguard.com>',
    to: params.toEmail,
    subject: `🚨 Possible copy of your listing detected on Etsy`,
    html: `
      <h2>We found a possible copy of one of your listings</h2>

      <table>
        <tr>
          <td>
            <strong>Your listing</strong><br/>
            <img src="${params.yourImageUrl}" width="120"/><br/>
            ${params.yourTitle}
          </td>
          <td>
            <strong>Suspected copy</strong><br/>
            <img src="${params.suspectedImageUrl}" width="120"/><br/>
            ${params.suspectedTitle}<br/>
            Shop: ${params.suspectedShopName}
          </td>
        </tr>
      </table>

      <p>Title similarity: <strong>${Math.round(params.titleSimilarity * 100)}%</strong></p>

      <p>
        <a href="${params.appUrl}/matches/${params.matchId}">
          View match + take action →
        </a>
      </p>

      <p style="color:#666;font-size:12px;">
        You're receiving this because you have daily scan alerts enabled.
        <a href="${params.appUrl}/settings">Manage notifications</a>
      </p>
    `,
  });
}
```

---

## 💳 Stripe Integration

### Products to create in Stripe Dashboard:
```
Product: EtsyGuard Solo
  Price: $15/mo recurring
  Price ID: store in STRIPE_SOLO_PRICE_ID env var
  Trial: 7 days

Product: EtsyGuard Pro  
  Price: $29/mo recurring
  Price ID: store in STRIPE_PRO_PRICE_ID env var
  Trial: 7 days
```

### Checkout Session:
```typescript
// Create checkout session
const session = await stripe.checkout.sessions.create({
  customer_email: userEmail,
  mode: 'subscription',
  line_items: [{ price: process.env.STRIPE_SOLO_PRICE_ID, quantity: 1 }],
  subscription_data: { trial_period_days: 7 },
  success_url: `${appUrl}/dashboard?upgraded=true`,
  cancel_url: `${appUrl}/billing`,
  metadata: { user_id: userId },
});
```

### Webhook events to handle:
```
checkout.session.completed       → create subscription record
customer.subscription.updated    → update status
customer.subscription.deleted    → mark canceled, restrict access
invoice.payment_failed           → send payment warning email
```

---

## 🎨 UI Design Guidelines

**Color palette:**
- Primary: `#F97316` (orange — Etsy-adjacent but distinct)
- Success: `#22C55E`
- Warning: `#EAB308`
- Danger: `#EF4444`
- Background: `#FAFAF9`
- Text: `#1C1917`

**Match status colors:**
- `new` → orange badge
- `reviewing` → blue badge
- `reported` → yellow badge
- `resolved` → green badge
- `dismissed` → gray badge

**Key UI components to build:**
1. `<MatchCard />` — side-by-side image + title comparison
2. `<ScanStatusBanner />` — "Last scanned 2 hours ago | Next scan in 22 hours"
3. `<ConnectShopButton />` — Etsy OAuth trigger
4. `<SimilarityBadge score={0.94} />` — color-coded percentage
5. `<ReportToEtsyButton listingUrl={url} />` — opens Etsy IP portal pre-filled

**Empty states (important for onboarding):**
- No shop connected → prompt to connect
- No listings found → check if shop has active listings
- No matches found → "Great news! No copies detected in your last scan."
- First scan running → progress indicator

---

## 🔒 Security Rules

### Supabase RLS Policies (enable on all tables)

```sql
-- shops: users can only see their own shops
CREATE POLICY "Users see own shops"
ON shops FOR ALL
USING (auth.uid() = user_id);

-- listings: users can only see listings from their shops
CREATE POLICY "Users see own listings"
ON listings FOR ALL
USING (
  shop_id IN (
    SELECT id FROM shops WHERE user_id = auth.uid()
  )
);

-- matches: same pattern
CREATE POLICY "Users see own matches"
ON matches FOR ALL
USING (
  shop_id IN (
    SELECT id FROM shops WHERE user_id = auth.uid()
  )
);
```

---

## 🌍 Environment Variables

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # Edge functions only, never client-side

# Etsy
ETSY_API_KEY=
ETSY_SHARED_SECRET=
ETSY_REDIRECT_URI=https://yourapp.com/auth/etsy/callback

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SOLO_PRICE_ID=
STRIPE_PRO_PRICE_ID=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

---

## 🧱 Component Prompting Guide

When asking Lovable or an AI assistant to build components, use these exact prompts:

**Dashboard:**
> "Build a dashboard page that shows: number of listings monitored, number of active matches, last scan time, next scan time, and a 'Scan Now' button. Pull data from Supabase tables `shops`, `listings`, `matches`, and `scan_logs`. Use shadcn/ui Card components. Show a loading skeleton while data loads."

**Match Card:**
> "Build a MatchCard component that shows two listings side by side: the seller's original listing (image + title) and the suspected copy (image + title + shop name + Etsy link). Show a similarity percentage badge. Include four action buttons: View on Etsy, Report to Etsy (links to https://www.etsy.com/ipreporting), Dismiss, and Mark Resolved. On action click, update the match status in Supabase."

**Onboarding:**
> "Build a 3-step onboarding flow: Step 1 shows a 'Connect your Etsy shop' button that redirects to the Etsy OAuth URL. Step 2 shows 'Importing your listings...' with a progress bar that polls Supabase for listing count. Step 3 shows 'Running your first scan' then redirects to dashboard when complete."

---

## 🚫 What NOT to Build (MVP Scope Guard)

If asked to build these, defer to post-MVP:
- ❌ Cross-platform scanning (Amazon, eBay, Redbubble)
- ❌ AI-generated cease & desist letters
- ❌ Real-time scanning / webhooks
- ❌ Team/agency multi-user access
- ❌ Chrome extension
- ❌ Mobile app
- ❌ Bulk DMCA filing
- ❌ Analytics/reporting dashboard

---

## ✅ Definition of Done (MVP)

The MVP is complete when:
- [ ] User can sign up, connect Etsy shop, and see their listings imported
- [ ] Daily scan runs automatically and creates match records
- [ ] User receives email alert when a match above threshold is detected
- [ ] User can view all matches, see side-by-side comparison, and take action
- [ ] User can pay $15/mo via Stripe with 7-day free trial
- [ ] Subscription gates access (non-paying users see dashboard but can't scan)
- [ ] App handles Etsy token expiry gracefully (auto-refresh)

---

*EtsyGuard — Protect what you create.*
