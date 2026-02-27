# Supabase Deployment & Setup Guide — EtsyGuard

Follow these steps to deploy your backend to the new Supabase project.

---

## 1. Environment Variables
Log in to your Supabase Dashboard and go to **Settings > API**. Then add these to **Edge Functions > Secrets**:

| Secret Name | Value | Description |
|---|---|---|
| `ETSY_API_KEY` | `your_keystring` | Etsy App API Key |
| `ETSY_REDIRECT_URI` | `https://your-site.com/onboarding` | Same as in Etsy dash |
| `RESEND_API_KEY` | `re_abc123` | For email alerts |
| `SUPABASE_SERVICE_ROLE_KEY` | `ey...` | Find in Settings > API |

---

## 2. Deploy Database Schema
Run this command from the root `/ETSY-GUARD` directory:

```bash
# This will push the migrations to your live DB
supabase db push
```

---

## 3. Deploy Edge Functions
Deploy all functions in one go:

```bash
supabase functions deploy etsy-oauth-callback
supabase functions deploy import-listings
supabase functions deploy scan-shop
supabase functions deploy refresh-etsy-token
```

---

## 4. Setup Daily Scan (SQL)
Run this SQL in the **Supabase SQL Editor** to automate the detections:

```sql
-- 1. Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule the Daily Scan (at 2 AM UTC)
-- Note: Replace <PROJECT_REF> and <SERVICE_ROLE_KEY>
SELECT cron.schedule(
  'daily-scan-all-shops',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://<PROJECT_REF>.functions.supabase.co/scan-shop',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'
    );
  $$
);

-- 3. Schedule Token Refresh (every 30 mins)
SELECT cron.schedule(
  'refresh-tokens-hourly',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://<PROJECT_REF>.functions.supabase.co/refresh-etsy-token',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'
    );
  $$
);
```

---

## 5. Local Discovery (Vite)
Update your `/frontend/listing-guardian/.env` with your new project keys:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ETSY_API_KEY=your-etsy-key
VITE_ETSY_REDIRECT_URI=http://localhost:5173/onboarding
```
