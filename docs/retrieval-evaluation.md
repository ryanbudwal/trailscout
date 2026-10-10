# Semantic retrieval evaluation

This is a small, reproducible comparison over TrailScout's 24 authored places. It checks the four user requests proposed for the submission against two retrieval methods:

- **Semantic:** normalized `all-MiniLM-L6-v2` query embeddings ranked by exact cosine similarity inside PostgreSQL with pgvector.
- **Keyword baseline:** the fraction of distinct, non-stopword query tokens found in each place's name, description and tags. Ties use stable catalogue ID.

A result is counted as relevant when it contains at least one query-specific authored tag. The relevance rules are explicit in `backend/app/evaluation.py`. This is demonstration evidence over a tiny catalogue, not a general benchmark.

## Measured local result

Run on October 10, 2026 against the verified local PostgreSQL database and pinned model revision:

| Query | Semantic relevant @ 3 | Keyword relevant @ 3 | Semantic relevant @ 5 | Keyword relevant @ 5 | Semantic first result | Keyword first result |
|---|---:|---:|---:|---:|---|---|
| I need somewhere peaceful to clear my head | 0 | 2 | 2 | 3 | Sunnybrook green loop | High Park woodland wander |
| A quiet walk underneath tall trees | 3 | 3 | 5 | 5 | Sherwood Park canopy walk | High Park woodland wander |
| Somewhere by the water to watch the sunset | 3 | 2 | 5 | 4 | Humber Bay shoreline | Humber Bay shoreline |
| A place to spot birds and explore wetlands | 3 | 2 | 5 | 2 | Colonel Samuel Smith Park | Colonel Samuel Smith Park |
| **Mean** | **2.25** | **2.25** | **4.25** | **3.50** | — | — |

Mean reciprocal rank was **0.812 for semantic retrieval** and **1.000 for keyword retrieval** under these tag rules. The keyword baseline did better on the broad “clear my head” request, while semantic retrieval returned more relevant options within the top five for the water/sunset and bird/wetland intents. Both methods were strong when the query shared words with the catalogue.

The result supports a narrow claim: embeddings broadened useful retrieval for some natural-language intents, but they did not beat simple keyword overlap on every query or every metric. TrailScout uses semantic search because people often describe a desired feeling rather than a park name, while SQL filters enforce exact constraints such as duration and difficulty.

## Reproduce

With a migrated and seeded database:

```bash
export PYTHONPATH=backend
python -m app.cli evaluate
```

The command prints the full top-five rankings, cosine or keyword score, relevant tags, per-query metrics and aggregate metrics as JSON. It is read-only. Re-run it after changing catalogue text, tags, model revision or retrieval logic rather than copying the numbers above.

The same evaluation was reproduced against Tiger Cloud on October 10, 2026. Its aggregate values matched the local result; the reviewed output is stored in `docs/tiger-retrieval-evaluation.json`.
