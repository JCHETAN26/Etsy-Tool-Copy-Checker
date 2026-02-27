-- Users (handled by Supabase Auth)

-- Connected Etsy shops
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  etsy_shop_id TEXT NOT NULL,
  shop_name TEXT,
  access_token TEXT,           -- encrypted
  refresh_token TEXT,          -- encrypted
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_scan_at TIMESTAMPTZ,
  UNIQUE(user_id, etsy_shop_id)
);

-- Imported listings from seller's shop
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  etsy_listing_id TEXT NOT NULL,
  title TEXT,
  image_url TEXT,
  image_hash TEXT,             -- pHash fingerprint
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, etsy_listing_id)
);

-- Detected matches (suspected copies)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
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
  reported_at TIMESTAMPTZ,
  UNIQUE(shop_id, suspected_etsy_listing_id)
);

-- Scan job log
CREATE TABLE scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
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
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,                 -- 'trialing', 'active', 'canceled', etc.
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- RLS POLICIES

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- shops: users can only see their own shops
CREATE POLICY "Users see own shops" ON shops 
FOR ALL USING (auth.uid() = user_id);

-- listings: users can only see listings from their shops
CREATE POLICY "Users see own listings" ON listings 
FOR ALL USING (
  shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
);

-- matches: users can only see matches from their shops
CREATE POLICY "Users see own matches" ON matches 
FOR ALL USING (
  shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
);

-- scan_logs: users can only see logs from their shops
CREATE POLICY "Users see own scan logs" ON scan_logs 
FOR ALL USING (
  shop_id IN (SELECT id FROM shops WHERE user_id = auth.uid())
);

-- subscriptions: users can only see their own subscriptions
CREATE POLICY "Users see own subscriptions" ON subscriptions 
FOR ALL USING (auth.uid() = user_id);
