-- Fix missing ON DELETE CASCADE on community_listings FK constraints
-- The original migration created these FKs without CASCADE

-- Drop and re-create published_by_id FK with CASCADE
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT constraint_name INTO fk_name
  FROM information_schema.table_constraints
  WHERE table_name = 'community_listings'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%published_by_id%';

  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE community_listings DROP CONSTRAINT ' || fk_name;
  END IF;
END $$;

ALTER TABLE community_listings
  ADD CONSTRAINT community_listings_published_by_id_fk
  FOREIGN KEY (published_by_id) REFERENCES users(id) ON DELETE CASCADE;

-- Drop and re-create org_id FK with CASCADE
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT constraint_name INTO fk_name
  FROM information_schema.table_constraints
  WHERE table_name = 'community_listings'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%org_id%';

  IF fk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE community_listings DROP CONSTRAINT ' || fk_name;
  END IF;
END $$;

ALTER TABLE community_listings
  ADD CONSTRAINT community_listings_org_id_fk
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
