# Safe setup and deployment

## Environment variables

| Name | Where | Value / purpose |
|---|---|---|
| `DATABASE_URL` | Backend secret only | Dedicated PostgreSQL service URL. For Tiger Cloud, use the connection details from its console and TLS verification. |
| `ALLOWED_ORIGINS` | Backend config | Comma-separated exact browser origins, including scheme and port. Production: only your deployed HTTPS origin. |
| `COOKIE_SECURE` | Backend config | `false` for HTTP localhost; `true` for HTTPS deployment. |
| `HF_HOME` | Backend runtime | Writable model-cache directory. Local: `.cache/huggingface`; image: `/app/.cache/huggingface`. |
| `HF_HUB_OFFLINE` | Backend runtime | `1` after a successful model download. Docker sets it after prefetching the pinned model. |
| `HF_HUB_DISABLE_TELEMETRY` | Backend runtime | `1` disables Hugging Face library telemetry. |
| `PORT` | Container runtime | HTTP listener port; default 8000. |

No frontend API key is required. Never add a database URL to `VITE_*`, browser storage, public code, screenshots or chat. `.env` and `.env.*` are gitignored; `.env.example` contains only local development values. Docker's context also excludes environment files.

## Connect Tiger Cloud

The local app is tested. Tiger Cloud has **not** been provisioned or tested for this project; account creation, charges and credentials are controlled by you.

1. Create or choose a Tiger Cloud PostgreSQL service in your account. Review any cost/trial limits in the console.
2. Copy the service connection URL into your local `.env` using your editor or the deployment host's secret manager. Keep the provider's TLS parameters and require TLS. If the provider supplies a trusted CA configuration, use `sslmode=verify-full` with the appropriate `sslrootcert`. Do not disable certificate verification to make a connection work.
3. With your migration/admin role, run `PYTHONPATH=backend python -m app.cli migrate`. This creates `vector`, the tables and indexes in the selected database.
4. If supported on your service, run `db/tiger-extensions.sql` in its SQL editor. `vectorscale` is optional for this application's exact pgvector search. Record which extensions are actually installed.
5. Run `PYTHONPATH=backend python -m app.cli seed`. This uploads the authored public catalogue and generated embeddings; it does not copy your local journal.
6. Start the API using the Tiger connection and verify `/api/health`, three different searches, and a temporary journal entry/deletion. Use a separate test database for the full automated suite.
7. Run `PYTHONPATH=backend python -m app.cli evidence > tiger-evidence.json`. Review the output; it reports TLS, extension/dimension/model facts and three searches, without the connection string. Keep credential-bearing or unreviewed evidence outside the repository. Do not rename local evidence to imply cloud usage.
8. In the Tiger SQL editor, run `db/tiger-evidence.sql` and capture the result table and service context without credentials. Follow the actual MLH form's current requirements.

For least privilege, use a separate application role after migrations. Grant only `CONNECT` on the selected database, `USAGE` on schema `public`, `SELECT` on `outdoor_places`, and `SELECT, INSERT, DELETE` on `walks`. Do not grant extension creation or table modification privileges to the running web app. The CLI seed requires a separate role that can insert/update places and use the identity sequence. Role passwords should be set through your database provider's secure console flow.

## Web deployment

Deploy one persistent Python web service or the supplied Docker image, with Tiger Cloud as its database. The React production build is served by FastAPI on the same origin. A serverless edge-only host is not suitable for loading the Python/PyTorch runtime and raw PostgreSQL connection used here.

Recommended sequence:

1. Build the Dockerfile or follow the native production build in the README. Docker build, Compose and Linux CI are supplied recipes, not verified deployments.
2. Start with one CPU worker and approximately 2–4 GB RAM; measure your host's actual startup and inference memory before sizing down. Allow a generous first-start health-check window.
3. Set `DATABASE_URL` in the host's secret manager. Set `ALLOWED_ORIGINS=https://your-actual-hostname` and `COOKIE_SECURE=true`. Use the exact deployed origin; leaving localhost values will cause browser writes to be rejected.
4. Configure HTTPS at the host/reverse proxy. Keep database access restricted and enable backups. Configure trusted proxy forwarding only for your actual reverse proxy.
5. Run migrations and seed as an explicit release step using the appropriate role. The app itself does not create schemas on boot.
6. Serve `uvicorn app.main:app --host 0.0.0.0 --port "$PORT"` with `PYTHONPATH=backend`, or use the container CMD. Configure `/api/health` as readiness check.
7. Smoke-test real search, empty states, saved places and journal isolation. Public deployments need gateway-level throttling, operational monitoring and a journal retention policy.

The repository is public at `https://github.com/ryanbudwal/trailscout`. No deployment or contest submission has been performed. Get explicit approval before creating paid resources, deploying or submitting the project.

## Troubleshooting

- **Connection refused:** ensure PostgreSQL is running and the URL/port matches. Workspace helper uses 55432; Compose defaults to 5432.
- **Port 8000 in use:** use the existing TrailScout server, or stop it before starting another.
- **`vector` missing:** install pgvector on the server, then migrate using a role permitted to create the extension.
- **No catalogue:** run seed after migration. Health intentionally returns 503 for an empty/mismatched catalogue.
- **Model unavailable:** allow the initial download to complete; check the cache location. Do not set offline mode until it is cached. There is no fake-AI fallback.
- **403 on saving/searching:** check the exact request Origin against `ALLOWED_ORIGINS`, and use a same-origin frontend deployment.
- **Blank basemap:** tiles require internet. The list and search still work; the location pins are approximate, not turn-by-turn directions.
- **Journal disappeared:** switching localhost/127.0.0.1, browsers, cookie jars or devices changes the anonymous session. Clearing cookies loses access.
