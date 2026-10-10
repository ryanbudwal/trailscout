<div align="center">

<h1>TrailScout AI</h1>
<h3>Describe the feeling. Find your outside.</h3>

<p>TrailScout turns a natural-language request into a short list of Toronto-area outdoor places using an open-weight embedding model and real vector retrieval in PostgreSQL.</p>

<p><strong>Less screen time. More time outdoors.</strong></p>

<p><a href="https://youtu.be/hJdTeWRmuCA">Watch the product demo</a> · <a href="https://dev.to/ryanbudwal14/trailscout-ai-describe-the-feeling-then-go-outside-ik">Read the DEV submission</a> · <a href="docs/architecture.md">Explore the architecture</a></p>

<a href="https://dev.to/challenges/hacktoberfest-week1-2026-10-05"><img src="https://img.shields.io/badge/Hacktoberfest_2026-Touch_Grass-D2FF4F?style=flat-square&labelColor=10251C" alt="Hacktoberfest 2026 Touch Grass" /></a>
<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=10251C" alt="React 19" />
<img src="https://img.shields.io/badge/TypeScript-typed-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/FastAPI-Python_3.13-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI with Python 3.13" />
<img src="https://img.shields.io/badge/MiniLM-384d_embeddings-FF9D45?style=flat-square" alt="MiniLM 384-dimensional embeddings" />
<img src="https://img.shields.io/badge/Tiger_Cloud-PostgreSQL-FF6F61?style=flat-square" alt="Tiger Cloud PostgreSQL" />
<img src="https://img.shields.io/badge/pgvector-0.8.7-336791?style=flat-square&logo=postgresql&logoColor=white" alt="pgvector 0.8.7" />

<p><a href="#product-overview">Overview</a> · <a href="#video-demonstration">Demo</a> · <a href="#features">Features</a> · <a href="#how-the-ai-works">AI retrieval</a> · <a href="#verified-tiger-cloud-integration">Tiger Cloud</a> · <a href="#technical-architecture">Architecture</a> · <a href="#quick-start">Quick start</a> · <a href="#testing-and-reliability">Testing</a></p>

</div>

---

![TrailScout desktop interface showing natural-language outdoor discovery, recommendations, and an interactive map](docs/desktop.png)

## Product overview

Sometimes the hardest part of going outside is deciding where to go.

TrailScout lets someone describe the experience they want—**“Somewhere by the water to watch the sunset”**—then retrieves authored Toronto-area suggestions that are close in meaning. Exact controls for duration, difficulty, and distance keep practical constraints separate from the semantic ranking.

The result is a focused place finder: discover an outing, understand why it fits, open its approximate location, and leave the screen behind. TrailScout does not generate routes or improvise trail advice. Every recommendation and explanation is grounded in its 24-place catalogue.

> **Product boundary:** TrailScout is an outdoor place finder, not a navigation or safety system. Durations, distances, difficulty, and map points are editorial estimates. It does not provide route geometries, live closures, weather, driving times, guaranteed accessibility, or availability.

## Video demonstration

<div align="center">

[![Watch the TrailScout AI product demonstration](https://img.youtube.com/vi/hJdTeWRmuCA/maxresdefault.jpg)](https://youtu.be/hJdTeWRmuCA)

**[Watch TrailScout search, filter, explain, and map real recommendations →](https://youtu.be/hJdTeWRmuCA)**

</div>

The application itself is not publicly hosted. The video is the working product demonstration submitted with the DEV article; Tiger Cloud verification is documented separately below.

## Features

| Experience                     | Implemented behavior                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Natural-language discovery** | MiniLM embeds requests such as “a quiet walk underneath tall trees” and pgvector ranks related place descriptions.    |
| **Practical filters**          | Duration, difficulty, and straight-line radius are enforced as parameterized SQL constraints.                         |
| **Authored recommendations**   | 24 Toronto-area destinations with grounded descriptions, tags, coordinates, and editorial estimates.                  |
| **Interactive map**            | Leaflet and OpenStreetMap provide approximate locations, keyboard-accessible pins, and external location links.       |
| **Transparent retrieval**      | The interface exposes cosine similarity, the pinned model, query timing, and catalogue-backed reasons for each match. |
| **Saved places**               | Bookmarks persist in the current browser.                                                                             |
| **Field journal**              | Completed dates, minutes, notes, aggregate totals, and deletion persist in PostgreSQL under an anonymous session.     |
| **Responsive interface**       | Desktop and mobile layouts preserve the search, recommendation, map, and journal flows.                               |
| **Motion control**             | Atmospheric movement can be paused and respects the operating system's reduced-motion preference.                     |

## How the AI works

```mermaid
flowchart LR
    A["Natural-language request"] --> B["FastAPI validation"]
    B --> C["MiniLM sentence embedding<br/>384 dimensions"]
    C --> D[(Tiger Cloud PostgreSQL<br/>pgvector)]
    B --> E["Duration · difficulty · radius"]
    E --> D
    D --> F["Cosine similarity<br/>+ SQL filtering"]
    F --> G["Ranked authored<br/>outdoor recommendations"]
```

TrailScout uses [`sentence-transformers/all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), an Apache-2.0 open-weight model pinned to revision `1110a243fdf4706b3f48f1d95db1a4f5529b4d41`.

At seed time, MiniLM converts each destination's name, description, and tags into a normalized 384-dimensional vector. At search time, the same model embeds the request. PostgreSQL then applies exact filters and ranks stored vectors with pgvector cosine distance.

This is retrieval, not a generative chatbot. The model helps match meanings; it does not invent trails, conditions, or recommendations outside the catalogue. If inference or the database fails, TrailScout reports the failure instead of returning fabricated results.

## Verified Tiger Cloud integration

TrailScout stores both destination metadata and MiniLM embeddings in a dedicated Tiger Cloud PostgreSQL service. The verified integration uses one parameterized query to combine vector similarity with duration, difficulty, geographic radius, and ingestion-time filters.

| Verified property      |                                          Result |
| ---------------------- | ----------------------------------------------: |
| PostgreSQL service     |                  Dedicated Tiger Cloud database |
| Vector extension       |                                pgvector `0.8.7` |
| Authored destinations  |                                            `24` |
| Embedding width        |                                `384` dimensions |
| Transport              |               Verified encrypted TLS connection |
| Retrieval              |    Real cosine similarity ranking in PostgreSQL |
| Structured constraints | Duration, difficulty, radius, and recorded time |

### Database and vector verification

![Tiger Cloud SQL verification showing pgvector 0.8.7, 24 outdoor destinations, and 384-dimensional embeddings](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/y6ukkicsblfrgkilqn90.png)

### Cosine similarity with metadata filters

![Tiger Cloud SQL editor showing pgvector cosine similarity ranking with duration and difficulty filters](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/rmv13ds0ajl20liqv6e8.png)

The SQL screenshot compares stored destination vectors to demonstrate pgvector ranking inside Tiger Cloud. The application performs the user-facing path: it embeds a natural-language request with MiniLM, sends the resulting vector to PostgreSQL, applies the structured filters, and returns the ranked destinations.

Reviewable evidence:

- [Credential-free Tiger Cloud verification](docs/tiger-evidence.json)
- [Tiger Cloud retrieval evaluation output](docs/tiger-retrieval-evaluation.json)
- [Evaluation method and measured results](docs/retrieval-evaluation.md)
- [SQL evidence queries](db/tiger-evidence.sql)

## Technical architecture

| Layer      | Technology                                | Responsibility                                                            |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| Interface  | React 19, TypeScript, Vite                | Search, results, saved places, journal, responsive interaction            |
| Maps       | Leaflet, OpenStreetMap                    | Approximate locations, zoom, and keyboard-accessible pins                 |
| API        | Python 3.13, FastAPI, Pydantic            | Validation, bounded inference, anonymous sessions, and error handling     |
| Embeddings | Sentence Transformers, PyTorch CPU        | Pinned open-weight MiniLM inference                                       |
| Database   | Tiger Cloud PostgreSQL, pgvector, Psycopg | Cosine retrieval, hard filters, and journal persistence                   |
| Delivery   | FastAPI static build                      | React and the API under one origin; database credentials stay server-side |

### Design decisions

1. **Semantic search is the AI feature.** Embeddings solve the matching problem without a paid inference API or a generative response layer.
2. **PostgreSQL performs the ranking.** The production query executes `embedding <=> query_vector` inside the database; Python does not sort a list to imitate vector search.
3. **Exact search fits this catalogue.** An exact scan preserves recall after filtering. An approximate index would add complexity without measurable benefit for 24 vectors.
4. **Meaning and constraints have separate jobs.** MiniLM handles semantic similarity while SQL enforces promises such as “easy” or “under 45 minutes.”
5. **Explanations stay grounded.** Result descriptions use stored duration, difficulty, and tags. Similarity is presented as a score, not a confidence percentage.
6. **One origin reduces exposure.** FastAPI serves the built frontend and API, so no database secret reaches the browser.

## Testing and reliability

The recorded verification uses the real MiniLM model and PostgreSQL/pgvector rather than mocked recommendations.

| Check                  | Verified result                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Backend integration    | **23 tests** covering dimensions, normalization, cosine agreement, filters, validation, persistence, isolation, and failures |
| Browser behavior       | **6 Playwright flows** across desktop and mobile                                                                             |
| Frontend               | TypeScript checks, formatting, and Vite production build passed                                                              |
| Continuous integration | GitHub Actions exercises the real-model PostgreSQL path on Linux                                                             |
| Retrieval evaluation   | Four natural-language queries compared semantic search with a documented keyword baseline                                    |

The small retrieval evaluation is deliberately candid. Both methods averaged **2.25 relevant results in the top three**. Semantic retrieval returned more relevant results by rank five—**4.25 versus 3.50**—while the keyword baseline achieved the stronger reciprocal-rank result. Embeddings broadened useful retrieval for some intents; they did not win every query or metric. See [the complete evaluation](docs/retrieval-evaluation.md).

## Quick start

### Prepared workspace

On the original prepared computer, from this repository directory:

```bash
./scripts/start-workspace.sh
```

Open `http://127.0.0.1:8000`. The helper reuses the workspace's Python environment, model cache, frontend build, and configured database. Press <kbd>Ctrl</kbd>+<kbd>C</kbd> to stop the server.

### Portable native setup

Requirements:

- Python 3.13
- Node.js 22.12 or a compatible newer release
- PostgreSQL 17+ with pgvector 0.8+
- Internet access for the initial dependency and model downloads

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements-lock.txt
cp .env.example .env
```

Edit `.env` locally with a connection string for a dedicated UTF-8 PostgreSQL database. The migration role must be able to create the `vector` extension. Never commit `.env`, paste its contents into chat, or include connection details in screenshots.

```bash
export PYTHONPATH=backend
python -m app.cli migrate
python -m app.cli seed
npm --prefix frontend ci
npm --prefix frontend run build
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Then open:

- Application: `http://127.0.0.1:8000`
- API documentation: `http://127.0.0.1:8000/docs`
- Readiness endpoint: `http://127.0.0.1:8000/api/health`

The first seed downloads roughly 90 MB of public model weights plus runtime dependencies. No Hugging Face token or paid AI key is required. Later starts reuse `HF_HOME`; after one successful download, `HF_HUB_OFFLINE=1` keeps model loading offline. Map tiles still require network access.

For frontend development, keep FastAPI running and start Vite in another terminal:

```bash
npm --prefix frontend run dev
```

Vite proxies `/api` to port 8000. Use `uvicorn app.main:app --reload` when iterating on backend code.

### Docker alternative

```bash
docker compose up --build
```

The supplied configuration builds the frontend, caches the model, starts pgvector PostgreSQL, migrates and seeds the database, and exposes TrailScout at `http://localhost:8000`. `docker compose down` stops the services while preserving the named database volume.

Docker was unavailable on the original build machine, so native execution is the verified path. The compose credentials and loopback bindings are for local development only.

## API usage

```bash
curl http://127.0.0.1:8000/api/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"a quiet place among trees","max_minutes":45,"difficulty":"easy","latitude":43.6532,"longitude":-79.3832,"radius_km":10}'
```

The API also accepts an explicit `recorded_after` timestamp, such as `"2026-10-09T00:00:00Z"`. This filters catalogue ingestion time; it does not represent current trail conditions.

## Run the tests

Use a dedicated migrated and seeded test database. The integration suite creates and deletes test journal records, so never point it at a production database.

```bash
export PYTHONPATH=backend
python -m pytest backend/tests -q
npm --prefix frontend run build

# Keep the backend running with the production frontend build, then:
cd frontend
npx playwright install chromium
npm run test:e2e
```

On the prepared computer, `./scripts/test-workspace.sh` uses the existing local runtime and browser installation.

## Repository structure

```text
backend/app/       API, validation, embeddings, database queries, CLI, catalogue
backend/tests/     Real PostgreSQL + model integration tests
frontend/src/      Typed React UI, Leaflet integration, original SVG landscapes
frontend/e2e/      Desktop and mobile browser tests
db/                Idempotent schema and Tiger evidence queries
docs/              Architecture, deployment, demo, evidence, verification
scripts/           Prepared-workspace launch and test helpers
Dockerfile         Portable image recipe
compose.yaml       Local PostgreSQL, setup, and web services
```

## Hackathon context

TrailScout was built for the **Hacktoberfest 2026 Open-Source AI Challenge, Week 1: Touch Grass** and entered in **Best Use of Tiger Data**.

The use of Tiger Data is functional rather than decorative: TrailScout stores its MiniLM embeddings in Tiger Cloud, performs cosine retrieval with pgvector, and combines that ranking with structured outdoor constraints in the same SQL query. The [published DEV submission](https://dev.to/ryanbudwal14/trailscout-ai-describe-the-feeling-then-go-outside-ik) includes the working demo and cloud-console evidence.

MLH Global Hack Week's [Implement AI-Powered Vector Search with pgvector](https://www.mlh.com/events/global-hack-week-open-source-90/challenges/01a11b66-3a25-902e-3690-f9ea40cd5014) challenge provided secondary context for the database implementation and evidence.

## Documentation

- [Published DEV article — repository copy](docs/dev-touch-grass-submission.md)
- [Architecture and growth path](docs/architecture.md)
- [Deployment and environment setup](docs/deployment.md)
- [Tiger Cloud evidence runbook](docs/tiger-cloud-evidence.md)
- [Credential-free Tiger Cloud evidence](docs/tiger-evidence.json)
- [Semantic retrieval evaluation](docs/retrieval-evaluation.md)
- [Verification record](docs/verification.md)
- [Data and asset provenance](docs/data-and-credits.md)

## Limitations

- The starter catalogue contains 24 Toronto-area places; it is not a comprehensive trail database.
- Map points and outing characteristics are authored estimates, not live operational data.
- TrailScout does not provide navigation, route geometries, weather, closures, or safety guidance.
- MiniLM inference runs on the server. The application is not an offline mobile app.
- OpenStreetMap tiles and external location links require network access.
- The application has been demonstrated locally against Tiger Cloud; it does not have a public hosted URL.

## AI assistance, licensing, and acknowledgements

OpenAI Codex assisted with architecture, implementation, testing, documentation, and original SVG landscape artwork. The implementation and claims were reviewed by the project author. Codex is not part of the runtime: TrailScout search uses MiniLM and PostgreSQL, with no OpenAI API.

Project code and original illustrations are licensed under the [MIT License](LICENSE). MiniLM is Apache-2.0. Fonts, icons, maps, and other dependencies retain their respective licenses; see [data and asset credits](docs/data-and-credits.md).

The visual references supplied during design informed rhythm and hierarchy only. Their photographs, logos, and interface assets are not included in TrailScout.
