---
title: "TrailScout AI: describe the feeling, then go outside"
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).*

> **Before publishing:** Replace every bracketed placeholder. Complete and verify Tiger Cloud, then keep the Tiger Data paragraphs and category; otherwise remove them. Remove this note. Do not add Best Use of Render unless a real Render deployment has been verified.

## What I Built

Sometimes the hardest part of going outside is deciding where to go.

TrailScout AI turns a request like “I need somewhere peaceful to clear my head” or “find me an easy 45-minute walk under tall trees” into a short list of suitable Toronto-area outdoor places. It is designed to make the screen the shortest part of the experience: describe the feeling, choose a place, and head outside.

The first edition includes 24 authored outdoor suggestions, from ravine walks and shaded parks to wetlands and waterfront pauses. A user can add exact limits for time, difficulty and distance; inspect why a result might fit; see its approximate location; open it in OpenStreetMap; save it; and record a completed outing in a private field journal.

TrailScout is deliberately a **place finder**, not a navigation or safety system. It does not invent routes, trail entrances, closures, weather or accessibility claims. Durations and distances are labeled estimates, and its explanations come from stored catalogue facts.

## Demo

[VIDEO DEMO — replace with the final 60–90-second video URL]

[LIVE APPLICATION — add only after a deployment has been completed and smoke-tested]

[TIGER CLOUD VERIFICATION SCREENSHOT — show the actual service context, pgvector extension, 24 vectors with 384 dimensions, and a filtered cosine query; exclude credentials]

[OUTDOOR TESTING PHOTO — optional; include only if TrailScout was actually used outside]

The demo uses this request:

> Somewhere by the water to watch the sunset, easy, under 45 minutes.

TrailScout embeds the sentence, applies the hard filters in SQL, and returns places whose descriptions are close in meaning. Opening a result shows the catalogue-backed explanation and a direct link to the location.

## Code

{% github ryanbudwal/trailscout %}

Repository: [github.com/ryanbudwal/trailscout](https://github.com/ryanbudwal/trailscout)

The repository includes the React interface, FastAPI service, idempotent database migration and seed command, a pinned open-weight model revision, local and Tiger Cloud evidence queries, integration tests, mobile/desktop browser tests, deployment guidance and the reproducible retrieval evaluation used below.

## How I Built It

### Open-weight AI that solves one focused problem

TrailScout uses [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), an Apache-2.0 open-weight sentence embedding model. At seed time, it converts each place's name, description and tags into a normalized 384-dimensional vector. At search time, it converts the user's request with the same pinned model revision.

I chose semantic retrieval instead of a generative chatbot because the product needs to find authored records, not improvise outdoor advice. There is no paid inference API and no hidden fallback response. If the model or database is unavailable, the interface reports the failure instead of displaying fake recommendations.

### PostgreSQL is the retrieval engine

Each vector lives beside the place's duration, difficulty, coordinates, tags and ingestion timestamp in PostgreSQL. pgvector computes exact cosine distance inside the database:

```sql
SELECT name,
       1 - (embedding <=> %(query_vector)s) AS similarity
FROM outdoor_places
WHERE difficulty = %(difficulty)s
  AND duration_minutes <= %(max_minutes)s
ORDER BY embedding <=> %(query_vector)s
LIMIT %(limit)s;
```

The production query is parameterized and also supports radius and timestamp constraints. This division matters: the model handles meaning; SQL enforces promises such as “easy” and “no longer than 45 minutes.”

Exact search is intentional. Twenty-four vectors do not need an approximate index, and an exact scan preserves recall after filtering. HNSW or Tiger Data's advanced vector indexing would become relevant only after a larger catalogue and a measured recall/latency evaluation.

### Meaningful Tiger Data use

[KEEP THIS SUBSECTION ONLY AFTER VERIFICATION]

TrailScout stores its MiniLM embeddings and structured place metadata in a dedicated Tiger Cloud PostgreSQL service. The same database query combines cosine ranking with duration, difficulty, geographic radius and ingestion-time filters. I verified the service over TLS, confirmed the `vector` extension, stored 24 vectors with exactly 384 dimensions, and captured the filtered ranking in the Tiger Cloud SQL editor.

[ADD ACTUAL TIGER CLOUD SERVICE/REGION DETAILS THAT ARE SAFE TO SHARE]

[LINK OR EMBED THE REDACTED TIGER CLOUD EVIDENCE SCREENSHOT]

Keeping vectors and metadata together gives TrailScout one transactional source of truth. I can filter before ranking, inspect the SQL, join retrieval results to journal data, and change the model without replacing the storage architecture.

### I tested the semantic-search claim

I compared MiniLM + pgvector with a simple keyword-overlap baseline on four natural requests and transparent, tag-based relevance rules. The full method and rankings are in [`docs/retrieval-evaluation.md`](https://github.com/ryanbudwal/trailscout/blob/main/docs/retrieval-evaluation.md).

Across the four queries, both approaches averaged **2.25 relevant results in the top three**. Semantic retrieval found more relevant choices by rank five—**4.25 versus 3.50**—but keyword search produced the first relevant result sooner under this small evaluation. In particular, semantic retrieval did poorly on the broad “clear my head” query and strongly on the tree, sunset/water and bird/wetland intents.

That is a more useful result than claiming embeddings always win. Semantic search broadens discovery when people describe an experience, while explicit filters and careful catalogue writing remain essential.

### Product and reliability work

The frontend is React 19, TypeScript and Vite, with Leaflet/OpenStreetMap for approximate park locations. FastAPI serves the production build and API from one origin, so database credentials never enter the browser. The field journal uses an anonymous HttpOnly session cookie; only its SHA-256 hash is stored as the ownership key.

The current verification suite runs against the real model and PostgreSQL/pgvector:

- 23 backend integration tests covering vectors, cosine math, filters, validation, persistence, isolation and failure handling.
- 6 Playwright flows across desktop and mobile covering search, map access, saved places, journal persistence, empty results and service recovery.
- TypeScript, Vite production build and formatting checks.
- GitHub Actions on the public repository.

OpenAI Codex assisted with architecture, implementation, testing, documentation and the original SVG landscape artwork. I reviewed the implementation and kept that assistance out of the runtime: TrailScout's search uses MiniLM and PostgreSQL, not an OpenAI API.

## Why Does Open Innovation Matter?

Open innovation made TrailScout inspectable from sentence to result.

The model revision is pinned. I can reproduce its 384-dimensional output, run it on CPU infrastructure I control, compare its database score with direct cosine math, and replace it later without rewriting the product around a proprietary response format. There is no per-search AI bill and no API key required for inference.

That control also makes the product more honest. I know which text was embedded, which filters ran, which distance operator PostgreSQL used, and which catalogue facts produced an explanation. A closed text-generation API would add operational cost and make it easier to present fluent but unsupported trail claims. For this task, open embeddings plus retrieval are the smaller and safer tool.

TrailScout is not an offline mobile app—the server still performs inference, and map tiles require a network connection. “Open” here means the model weights, retrieval code and evaluation are available to inspect and run on infrastructure under the builder's control.

Most of all, the open pieces support the theme. The AI is meant to end the interaction quickly. Its success is not another conversation on a screen; it is a person finding a realistic nearby option and putting the phone away.

## My Agent Session (optional)

[DEVRELAY AGENT SESSION — optional; add only after exporting and reviewing the session]

OpenAI Codex was used as a development collaborator. The repository documents the implemented boundaries, verification results and unverified cloud steps so that AI assistance does not become evidence by assertion.

## Prize Categories

- **Best Use of Tiger Data** — [KEEP ONLY AFTER TIGER CLOUD MIGRATION, TLS CHECK AND CLOUD-CONSOLE EVIDENCE ARE COMPLETE]

Best Use of Render is intentionally omitted from this draft because TrailScout has not been deployed on Render. One submission may list multiple categories, but only technologies actually used by the project belong here.
