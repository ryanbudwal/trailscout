-- Read-only proof for the Tiger Cloud SQL editor. No credentials or private logs.
SELECT current_database() AS database,
       current_setting('server_version') AS postgres_version,
       ssl, version AS tls_version, cipher
FROM pg_stat_ssl
WHERE pid = pg_backend_pid();

SELECT extname, extversion FROM pg_extension
WHERE extname IN ('vector','vectorscale','timescaledb');

SELECT count(*) AS embedded_places,
       min(vector_dims(embedding)) AS min_dimensions,
       max(vector_dims(embedding)) AS max_dimensions,
       count(DISTINCT embedding_model) AS embedding_models,
       min(recorded_at) AS earliest_record,
       max(recorded_at) AS latest_record
FROM outdoor_places;

SELECT embedding_model, count(*) AS embedded_places
FROM outdoor_places
GROUP BY embedding_model;

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

-- Filtering proof independent of the ranking example above.
SELECT name, duration_minutes, difficulty, tags
FROM outdoor_places
WHERE difficulty = 'easy'
  AND duration_minutes <= 45
ORDER BY duration_minutes, name;
