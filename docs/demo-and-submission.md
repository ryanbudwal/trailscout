# Demo and MLH submission

## Confirmed challenge text

The official [Implement AI-Powered Vector Search with pgvector challenge](https://www.mlh.com/events/global-hack-week-open-source-90/challenges/01a11b66-3a25-902e-3690-f9ea40cd5014), checked October 9, 2026, describes Tiger Data vector search with time and metadata filters and asks for a screenshot of and/or link to the vector database. This is the primary target. Check your signed-in form for its exact deadline, eligibility and required fields; do not rely solely on the original project-plan dates.

The project's **local** implementation meets the technical demonstration path for real embeddings and pgvector. Tiger Cloud usage is still pending. DEV Touch Grass materials are documented separately in `dev-touch-grass-submission.md`, `dev-demo-script.md` and `submission-readiness.md`.

## 90-second demonstration

| Time | Action | Say |
|---|---|---|
| 0–12 s | Show the Explore screen. | “TrailScout helps you turn an outdoor mood into a small local adventure.” |
| 12–30 s | Search `a peaceful shaded stroll under a leafy canopy`; select Easy and Up to 45 min before submitting. | “An open-weight MiniLM model turns this request into 384 numbers. PostgreSQL compares that vector with embedded place descriptions.” |
| 30–42 s | Expand the search proof and open a matched place. | “SQL enforces the filters. The score is cosine similarity, not confidence. The explanation uses the stored facts.” |
| 42–54 s | Search `open water and sunset photography on the lake shore`. | “A different meaning brings different places to the top; this is semantic retrieval rather than exact word matching.” |
| 54–65 s | Save a place, open Saved places, log a completed walk, show Field journal. | “Saved places stay in this browser; completed walks persist in PostgreSQL in an isolated anonymous session.” |
| 65–82 s | Show the actual Tiger Cloud SQL results and evidence JSON, once configured. | “These are stored vectors and similarity queries in our Tiger Cloud database, with metadata and ingestion-time filtering.” |
| 82–90 s | Show the tests and repository structure. | “The MVP is tested locally end to end. Estimates and map locations are clearly labeled. No generated trail claims or navigation promises.” |

Until Tiger Cloud is connected, say “local PostgreSQL” in the database segment. Do not claim cloud deployment, vectorscale acceleration, a hypertable, or verified trail conditions.

## Database evidence

Run the read-only queries in `db/tiger-evidence.sql` and capture:

- The actual service context and installed extension versions.
- 24 embedded records with vector dimension 384.
- The returned names, durations, timestamps and similarity values for a filtered query.
- A request/response from the application showing a natural-language query encoded by MiniLM.

The API additionally supports an explicit `recorded_after` timestamp. For example, query using a UTC timestamp just before seed time, then a future timestamp; the latter returns no records. This demonstrates ingestion-time filtering honestly. It does not represent live trail conditions.

`docs/local-evidence.json` was produced by a real local run. Re-run the CLI against Tiger Cloud and keep that result as a separately named artifact. Do not show `.env`, URLs containing credentials, passwords, database users' personal information or your private journal notes.

## Before you submit

1. Register/check in through the official MLH flow as required; confirm the current submission deadline and eligibility in your account.
2. Configure and verify your own Tiger Cloud service using `deployment.md`.
3. Capture clean database evidence and your 60–90-second demo.
4. Review the README, license, AI-tool disclosure and actual verification status. Replace any deployment placeholders with real verified details.
5. Review the public repository and local working tree for secrets before every push. `.env` is excluded. The repository is public; cloud credentials and evidence files still require careful review.
6. Open the official challenge, sign in, choose its submission action, and attach the evidence the form requests. Include the repository and demo only where allowed.
7. Review the completed form yourself before submitting. No automatic submission is included in this project.

## Questions judges may ask

**Why pgvector?** It keeps vectors, metadata, dates and journal records in the same transactional database and supports SQL filtering alongside similarity search.

**What makes it AI?** A pretrained open-weight transformer maps varied language into a shared embedding space; the database retrieves descriptions near the query vector.

**Why not an LLM?** Retrieval solves the task with lower operational complexity and avoids generating unsupported claims about trails.

**How do you know it works?** Real-model relevance tests cover three distinct intents; SQL scores are checked against direct cosine math. Integration tests exercise constraints and privacy, and browser tests exercise the actual UI/API/database path.

**What would you build next?** Verified trail data and access information first, then account recovery/sync and larger-catalogue retrieval evaluation. Approximate vector indexes only after scale warrants them.
