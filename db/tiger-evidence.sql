-- Read-only proof for the Tiger Cloud SQL editor. No credentials or private logs.
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('vector','vectorscale','timescaledb');

SELECT count(*) AS embedded_places,
       min(vector_dims(embedding)) AS dimensions,
       min(recorded_at) AS earliest_record,
       max(recorded_at) AS latest_record
FROM outdoor_places;

-- Similarity + metadata + time context. This uses a stored place vector;
-- the application's /api/search uses a real MiniLM query vector instead.
SELECT name, duration_minutes, difficulty, recorded_at,
       round((1 - (embedding <=> (
         SELECT embedding FROM outdoor_places WHERE slug='high-park'
       )))::numeric, 4) AS cosine_similarity
FROM outdoor_places
WHERE difficulty='easy'
  AND duration_minutes <= 60
  AND recorded_at >= now() - interval '30 days'
ORDER BY embedding <=> (
  SELECT embedding FROM outdoor_places WHERE slug='high-park'
)
LIMIT 5;
