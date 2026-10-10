# Tiger Cloud migration and evidence runbook

TrailScout uses ordinary PostgreSQL connections, the `vector` extension, a fixed `VECTOR(384)` column and parameterized pgvector cosine queries. On **October 10, 2026**, the application was migrated to a dedicated Tiger Cloud service, seeded and verified with real MiniLM queries. The reviewed, credential-free output is stored in `docs/tiger-evidence.json`.

Tiger Data documents pgvector as available on AI-focused Tiger Cloud services, and describes Tiger Cloud services as PostgreSQL-compatible. Use the connection details issued by your own service. Do not copy credentials into source files, screenshots, terminal recordings or the DEV article.

## 1. Prepare a dedicated service

1. Create or select a dedicated Tiger Cloud service suitable for AI/vector workloads.
2. In the Tiger Cloud console, copy the PostgreSQL connection string into the local `.env` file as `DATABASE_URL`. Keep `.env` untracked.
3. Use the provider-supplied TLS settings. At minimum, require TLS. If Tiger supplies a trusted CA chain/file for your client, prefer full hostname and certificate verification.
4. Use a migration/admin credential only for migration and seed. Use a separate least-privilege runtime credential for the deployed app.

Before any write, confirm that the selected database is dedicated to TrailScout. The migration is idempotent, but it creates extensions, tables and indexes.

## 2. Migrate and seed

From the repository root, with the Python environment active:

```bash
export PYTHONPATH=backend
python -m app.cli migrate
python -m app.cli seed
```

Expected messages:

```text
Schema ready.
Seeded 24 real MiniLM vectors (384 dimensions).
```

`seed` generates embeddings with the pinned open-weight model and upserts the public place catalogue. It does not copy local journal records.

## 3. Capture application-generated evidence

The verified run used:

```bash
python -m app.cli evidence > docs/tiger-evidence.json
```

Open the file and confirm all of the following before calling it Tiger Cloud evidence:

- `connection.tls.ssl` is `true`.
- The database name is the intended dedicated service database.
- `vector` is listed under `extensions`.
- The catalogue has 24 rows and both minimum and maximum dimensions are 384.
- Exactly one embedding model is present and its pinned revision is shown.
- The three natural-language searches have distinct, plausible rankings.

The command deliberately omits host, port, username and password. It is read-only, but model inference still runs locally on the application machine. The October 10 result confirms TLS 1.3, pgvector 0.8.7, 24 rows, 384 dimensions, one pinned embedding model and three successful natural-language rankings.

## 4. Capture SQL-console evidence

Open the Tiger Cloud SQL editor and run `db/tiger-evidence.sql`. Capture two clean screenshots:

1. **Service and vectors:** the visible Tiger Cloud service context plus TLS status, extension version, 24 embedded rows, 384 dimensions and pinned model identity.
2. **Similarity and filtering:** names, duration, difficulty, timestamps and cosine values from the filtered ranking query.

Crop out connection strings, usernames, passwords, billing details and unrelated services. Keep enough console chrome visible to establish that the query ran in Tiger Cloud. Do not use the local JSON file as a substitute for a cloud-console screenshot.

## 5. Verify the live application safely

Start TrailScout with the Tiger Cloud `DATABASE_URL`, then check:

```bash
curl --fail --silent http://127.0.0.1:8000/api/health
curl --fail --silent http://127.0.0.1:8000/api/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"somewhere by the water to watch the sunset","limit":5}'
```

Verify two more meanings in the interface: a shaded tree walk and birdwatching/wetlands. Do not run the full integration suite against a cloud database that contains real journal data; the suite creates and deletes test walk records.

## 6. Least-privilege runtime role

After migration and seed, grant the runtime role only:

- `CONNECT` on the selected database.
- `USAGE` on schema `public`.
- `SELECT` on `outdoor_places`.
- `SELECT`, `INSERT` and `DELETE` on `walks`.

The runtime role does not need extension creation, schema migration, catalogue mutation or access to other databases. Store its password in the deployment host's secret manager.

## Evidence claim boundary

The project can claim **real Tiger Cloud PostgreSQL + pgvector integration**: migration, seed, TLS, extension state, stored-vector dimensions and application-generated similarity searches were verified against the cloud service on October 10, 2026. A clean Tiger Cloud SQL-console screenshot is still required for the strongest visual submission evidence.
