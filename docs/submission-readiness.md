# Submission readiness

Status reviewed on **October 10, 2026**. The official deadline is **October 11, 2026 at 11:59 PM PDT**. Recheck the signed-in challenge page before publication.

## Verified and complete

- Public repository: `https://github.com/ryanbudwal/trailscout`.
- GitHub reports that the repository was created on October 10, 2026, inside the October 5–11 challenge window; the first local commit is also dated October 10.
- Current baseline commit `00d8d40` is present on `origin/main`.
- GitHub Actions run 1, “Test TrailScout,” completed successfully for that commit on October 10, 2026.
- Real `all-MiniLM-L6-v2` inference at the pinned revision, 384 dimensions and normalized vectors.
- PostgreSQL 17.6 with pgvector 0.8.1 locally; 24 stored embeddings.
- Tiger Cloud PostgreSQL 18 with pgvector 0.8.7; 24 stored MiniLM embeddings.
- Verified encrypted Tiger Cloud session using TLS 1.3 and a 256-bit cipher.
- Credential-free Tiger Cloud capability and semantic-ranking evidence in `docs/tiger-evidence.json`.
- Four-query retrieval evaluation reproduced against Tiger Cloud in `docs/tiger-retrieval-evaluation.json`.
- Exact cosine ranking runs inside PostgreSQL with parameterized duration, difficulty, radius and timestamp filters.
- Three distinct natural-language rankings captured in `docs/local-evidence.json`.
- Reproducible four-query semantic-versus-keyword evaluation with measured limitations.
- Catalogue-backed result explanations and direct OpenStreetMap location action.
- Responsive cinematic frontend, saved places, map and persistent anonymous journal.
- Secret handling, origin checks, body limits, generic service errors and server-only database configuration.
- DEV submission draft using the official section names and required tags.
- 60–90-second DEV demo script.

## Requires user action

### Required for Best Use of Tiger Data

- Run `db/tiger-evidence.sql` in the Tiger Cloud SQL editor.
- Capture the two credential-free evidence screenshots.
- Add the reviewed screenshots alongside `docs/tiger-evidence.json` in the submission materials.

### Required for the DEV submission

- Confirm all personal eligibility requirements are met, including age and location rules.
- Record and upload the final demo video.
- Replace every bracketed placeholder in `docs/dev-touch-grass-submission.md`.
- Add a real outdoor-use photo only if the app was actually tested outside and the photo can be published.
- Optionally export and review a DevRelay agent session before linking it.
- Preview the article on DEV, verify its links/media, and publish before the deadline.
- Submit through the official challenge flow. Publication/submission is a user action.

## Category eligibility

| Category | Current status | What changes the status |
|---|---|---|
| Overall Touch Grass challenge | Technically ready; publication pending | Publish the compliant DEV article during the contest window. |
| Best Use of Tiger Data | **Technically verified; screenshots pending** | Capture clean Tiger Cloud SQL-console evidence and include it with the verified JSON report. |
| Best Use of Render | **Not eligible** | Would require a real, reliable Render deployment. This was intentionally deprioritized. |
| Other partner categories | **Not claimed** | No qualifying technology was added merely for category coverage. |

## Unresolved blockers

1. Tiger Cloud SQL-console screenshots have not been captured yet.
2. No live deployment URL or uploaded demo video exists.
3. No actual outdoor testing/photo has been provided.
4. DEV publication and contest submission require the user's review and explicit action.
