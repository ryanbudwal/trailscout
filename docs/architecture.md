# Architecture and implementation decisions

## Retrieval path

1. `cli seed` reads the versioned catalogue and embeds each name, original description and tags using the pinned MiniLM revision. Vectors are normalized and stored in `VECTOR(384)` together with the model identity.
2. Pydantic accepts a query of 3–500 characters plus bounded, typed filters. Coordinate pairs must be complete; time boundaries require an explicit timezone.
3. A single CPU model instance per API process encodes the query. A lock prevents simultaneous model executions; an in-memory cache retains up to 128 repeated query embeddings. Queries are not written to the database.
4. A bounded Psycopg connection pool executes parameterized SQL. Metadata and ingestion-time predicates run inside PostgreSQL. Great-circle distance uses a clamped spherical cosine formula and a 6,371 km Earth-radius approximation; this is not road distance.
5. pgvector computes cosine distance. Results use `1 - distance` and are sorted by descending similarity, then stable ID. There is no fake percentage conversion, hard-coded ranking, or fallback search implementation.
6. Explanations are deterministic catalogue properties. They are not a model's hidden reasoning or a generated assessment of safety.

## Why no approximate index yet?

For 24 records, an exact scan is simple and fast and avoids the recall trade-offs of approximate nearest-neighbour indexes combined with filters. B-tree indexes support difficulty/duration, ingestion time and journal ownership/date. An HNSW or Tiger Data DiskANN index belongs after a larger dataset and evaluation of filtered recall. It is deliberately not claimed as an implemented performance feature.

The `vectorscale` extension script is optional for Tiger Cloud; merely installing it does not make the application use DiskANN. No Timescale hypertable is created in this MVP. The time filter refers to `outdoor_places.recorded_at`, which is the seed/ingestion time, not the time of a real observation or walk. Upserts retain original ingestion time.

## Evaluation boundary

`python -m app.cli evaluate` compares exact semantic retrieval with a documented token-overlap baseline over four natural-language requests. Relevance uses explicit authored tag sets. The October 10 local run tied at a mean 2.25 relevant results in the top three; semantic retrieval returned more relevant results by rank five (4.25 versus 3.50), while keyword retrieval had the higher reciprocal-rank result. This small evaluation supports a limited claim about broadening some natural-language retrieval, not universal superiority. See `docs/retrieval-evaluation.md` for the method and per-query results.

## Persistence and boundaries

- Place IDs remain stable through seed upserts keyed by slug.
- Bookmarks are a list of IDs stored only in localStorage. They are not synced.
- Walks are real PostgreSQL records. A 256-bit random token is placed in an HttpOnly, SameSite=Lax cookie; only its SHA-256 hash is used as the ownership key in SQL. Every journal read and delete includes that ownership condition.
- The browser does not choose an owner ID. A newly generated token on another client cannot view a prior visitor's walks. There is no sign-in, account recovery, social feature, or sharing of journal records.
- A lost cookie means lost access to the journal. An account system and retention policy are required before treating this as long-term personal storage.
- Times are integer minutes; completion dates are calendar dates. The API tolerates UTC+14 being one calendar day ahead of UTC, while the browser uses the user's local date as its maximum.

## Errors and operational limits

Startup loads the real model and connects to the configured database. `/api/health` verifies a matching seeded catalogue and the extension. Missing services cause failure, not fake results. Search model errors and database errors return generic 503 responses. An 8 KB request body limit, parameter validation, an 8-second database statement timeout and 30-second frontend request timeout bound work.

Search is limited to 60 requests per minute per direct client address in one process. This is a local-demo limiter, not distributed abuse protection. Behind a proxy, configure trusted forwarding deliberately; add gateway rate limits for public deployment. The model is serialized per process and each worker consumes additional memory. Start with one worker and measure before scaling.

CORS and mutation origins use an explicit allowlist. SameSite cookies and rejected cross-site mutations provide browser CSRF protection. Production requires HTTPS, `COOKIE_SECURE=true`, a least-privilege database role, private network access where possible, backed-up persistent storage, and deployment-specific monitoring. Database credentials never enter React, request responses, or evidence files. Do not log connection exception text in public-facing error handlers.

## Deliberately outside the MVP

Turn-by-turn navigation, GPX export, live conditions, verified route distances, driving-time estimates, live weather, personalized medical/accessibility advice, accounts, multi-device sync, generated trail reviews, automated hackathon submission and cloud provisioning are not implemented.

## Sources

- [pgvector official reference](https://github.com/pgvector/pgvector): cosine distance and exact/approximate search.
- [MiniLM model card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2): model license, 384 dimensions, intended sentence-search use, truncation behavior.
- [MLH challenge](https://www.mlh.com/events/global-hack-week-open-source-90/challenges/01a11b66-3a25-902e-3690-f9ea40cd5014): vector search with metadata/time context and database evidence.
