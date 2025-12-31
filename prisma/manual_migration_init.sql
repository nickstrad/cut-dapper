-- =============================================================================
-- MANUAL MIGRATION: Search Optimization with Materialized View
-- Run this AFTER: prisma migrate dev (to create base tables from schema.prisma)
-- =============================================================================
-- -----------------------------------------------------------------------------
-- 1. GIN Index on tags JSONB field for efficient tag queries
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "videos_tags_gin_idx" ON "videos" USING GIN(tags);

-- -----------------------------------------------------------------------------
-- 2. Create materialized view for optimized faceted search
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW video_search_mv AS
SELECT
  v.id,
  v."videoId",
  v.title,
  v.description,
  v."thumbnailUrl",
  v.duration,
  v."channelTitle",
  v.tags,
  v."createdAt",
  v."updatedAt",
  -- Aggregate brands and models from related clippers into arrays
  COALESCE(array_agg(DISTINCT c.brand) FILTER (WHERE c.brand IS NOT NULL), '{}') AS brands,
  COALESCE(array_agg(DISTINCT c.model) FILTER (WHERE c.model IS NOT NULL), '{}') AS models,
  -- Keep clipper details for display (as JSONB array)
  COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'brand', c.brand, 'model', c.model)) FILTER (WHERE c.id IS NOT NULL), '[]'::jsonb) AS clipper_details
FROM
  videos v
  LEFT JOIN video_clippers vc ON v.id = vc."videoId"
  LEFT JOIN clippers c ON vc."clipperId" = c.id
GROUP BY
  v.id,
  v."videoId",
  v.title,
  v.description,
  v."thumbnailUrl",
  v.duration,
  v."channelTitle",
  v.tags,
  v."createdAt",
  v."updatedAt";

-- -----------------------------------------------------------------------------
-- 3. Indexes on materialized view for fast queries
-- -----------------------------------------------------------------------------
-- Unique index (required for REFRESH MATERIALIZED VIEW CONCURRENTLY)
CREATE UNIQUE INDEX video_search_mv_id_idx ON video_search_mv(id);

-- Index for channel filtering
CREATE INDEX video_search_mv_channel_idx ON video_search_mv("channelTitle");

-- GIN indexes for array containment queries (brands && ARRAY['Wahl'])
CREATE INDEX video_search_mv_brands_idx ON video_search_mv USING GIN(brands);

CREATE INDEX video_search_mv_models_idx ON video_search_mv USING GIN(models);

-- GIN index for JSONB tag queries
CREATE INDEX video_search_mv_tags_idx ON video_search_mv USING GIN(tags);

-- Index for sorting by creation date
CREATE INDEX video_search_mv_created_at_idx ON video_search_mv("createdAt" DESC);

-- Full-text search index (optional but recommended for text search)
CREATE INDEX video_search_mv_fulltext_idx ON video_search_mv USING GIN(to_tsvector('english', title || ' ' || description || ' ' || "channelTitle"));

-- -----------------------------------------------------------------------------
-- 4. Trigger function to auto-refresh materialized view on data changes
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_refresh_video_search_mv()
  RETURNS TRIGGER
  AS $$
BEGIN
  -- REFRESH CONCURRENTLY allows reads during refresh (requires unique index)
  -- At ~2000 videos, this takes ~50-200ms
  REFRESH MATERIALIZED VIEW CONCURRENTLY video_search_mv;
  RETURN NULL;
END;
$$
LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 5. Attach triggers to all tables that affect the search view
-- -----------------------------------------------------------------------------
-- Trigger on videos table
CREATE TRIGGER videos_changed
  AFTER INSERT OR UPDATE OR DELETE ON videos
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_video_search_mv();

-- Trigger on clippers table
CREATE TRIGGER clippers_changed
  AFTER INSERT OR UPDATE OR DELETE ON clippers
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_video_search_mv();

-- Trigger on video_clippers junction table
CREATE TRIGGER video_clippers_changed
  AFTER INSERT OR UPDATE OR DELETE ON video_clippers
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_video_search_mv();

-- -----------------------------------------------------------------------------
-- Done! The materialized view will now automatically stay in sync.
-- Query it with: SELECT * FROM video_search_mv WHERE ...
-- -----------------------------------------------------------------------------
