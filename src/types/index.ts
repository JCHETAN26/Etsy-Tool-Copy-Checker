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
