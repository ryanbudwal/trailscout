# Submission readiness

Status reviewed on **October 10, 2026**. The official deadline is **October 11, 2026 at 11:59 PM PDT**. Recheck the signed-in challenge page before publication.

## Verified and complete

- Public repository: `https://github.com/ryanbudwal/trailscout`.
- GitHub reports that the repository was created on October 10, 2026, inside the October 5–11 challenge window; the first local commit is also dated October 10.
- Current baseline commit `00d8d40` is present on `origin/main`.
- GitHub Actions run 1, “Test TrailScout,” completed successfully for that commit on October 10, 2026.
- Real `all-MiniLM-L6-v2` inference at the pinned revision, 384 dimensions and normalized vectors.
- PostgreSQL 17.6 with pgvector 0.8.1 locally; 24 stored embeddings.
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

- Create or select a dedicated Tiger Cloud service and review its plan/limits.
- Put its credential in the untracked `.env` file or secret manager.
- Follow `docs/tiger-cloud-evidence.md` to migrate, seed and verify TLS.
- Run `python -m app.cli evidence` against Tiger Cloud and review the redacted output.
- Run `db/tiger-evidence.sql` in the Tiger Cloud SQL editor.
- Capture the two credential-free evidence screenshots.
- Only then keep “Best Use of Tiger Data” in the DEV article.

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
| Best Use of Tiger Data | **Not yet verified** | Complete real Tiger Cloud migration, application queries and cloud evidence. |
| Best Use of Render | **Not eligible** | Would require a real, reliable Render deployment. This was intentionally deprioritized. |
| Other partner categories | **Not claimed** | No qualifying technology was added merely for category coverage. |

## Unresolved blockers

1. No Tiger Cloud credential or verified service is available in the local environment.
2. No live deployment URL or uploaded demo video exists.
3. No actual outdoor testing/photo has been provided.
4. DEV publication and contest submission require the user's review and explicit action.
