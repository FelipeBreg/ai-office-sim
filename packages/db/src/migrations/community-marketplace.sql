-- Community & Marketplace Migration (Phase 5)
-- Run from packages/db/: DATABASE_URL=<url> node -e "..."

-- 1. community_listings
CREATE TABLE IF NOT EXISTS community_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_pt_br TEXT,
  description_en TEXT NOT NULL,
  description_pt_br TEXT,
  category TEXT NOT NULL,
  icon TEXT DEFAULT 'bot',
  snapshot JSONB NOT NULL,
  published_by_id UUID NOT NULL REFERENCES users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  install_count INTEGER NOT NULL DEFAULT 0,
  rating_sum INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS community_listing_slug_idx ON community_listings(slug);
CREATE INDEX IF NOT EXISTS community_listing_type_category_idx ON community_listings(type, category);
CREATE INDEX IF NOT EXISTS community_listing_published_by_idx ON community_listings(published_by_id);
CREATE INDEX IF NOT EXISTS community_listing_install_count_idx ON community_listings(install_count);
CREATE INDEX IF NOT EXISTS community_listing_created_at_idx ON community_listings(created_at);

-- 2. community_installs
CREATE TABLE IF NOT EXISTS community_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES community_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS community_install_listing_project_idx ON community_installs(listing_id, project_id);

-- 3. community_reviews
CREATE TABLE IF NOT EXISTS community_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES community_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS community_review_listing_user_idx ON community_reviews(listing_id, user_id);
CREATE INDEX IF NOT EXISTS community_review_listing_idx ON community_reviews(listing_id);
