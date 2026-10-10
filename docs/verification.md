# Verification record

Verified on **October 10, 2026**, on this macOS Apple Silicon workspace. This record describes actual local execution, not a cloud deployment.

## Passed

| Check | Observed result |
|---|---|
| Real model download and encoding | Pinned all-MiniLM-L6-v2 loaded on CPU; 384 dimensions; normalized vector tested |
| PostgreSQL integration | Isolated PostgreSQL 17.6 with pgvector 0.8.1, listening only on 127.0.0.1:55432 |
| Migration and seed | Schema applied, 24 actual model vectors inserted; repeat migration/seed succeeded with offline model cache |
| Backend tests | **22 passed**; no fake model/database substitute in semantic and persistence tests |
| Frontend production build | Prettier check, TypeScript checking and Vite production build succeeded |
| Browser tests | **6 passed**: 3 flows each on desktop Chromium (1440 × 1050) and mobile Chromium emulating iPhone 13 (390 × 664 CSS px) |
| HTTP readiness | `/api/health` returned ready, 24 places, 384 dimensions, pgvector 0.8.1 |
| Actual vector evidence | CLI emitted `local-evidence.json` from the real database and model |
| Visual inspection | Desktop and mobile screenshots reviewed; no horizontal document overflow in browser assertions |
| Dependency audit | npm install audit reported zero known vulnerabilities at installation; this is not a complete security audit |

### Backend coverage

Three distinct semantic intents; normalized model dimensions; stored vector dimensions/model identity; hard duration/difficulty/radius constraints; missing/invalid coordinates; ingestion-time filtering; no-result cases; malicious input staying data; agreement of database cosine scores with direct vector math; journal persistence and ownership isolation; scoped deletion; invalid and nonexistent places; safe cookie flags; origin rejection; body/content-type limits; rate limiting; redacted model and database failures.

The test runner reports one upstream Starlette deprecation warning about its httpx test transport. It does not fail the tests; transport migration can be handled with a future dependency upgrade.

### Browser coverage

Actual UI → FastAPI → model/PostgreSQL requests; search filters; result rendering; bookmarking and localStorage persistence across reload; detail dialog; journal creation and reload persistence; deletion; no-match reset; named map pin keyboard activation; Escape dismissal; no page errors in the primary flow; no horizontal overflow; simulated service failure displaying a real error and successful retry after recovery.

The failure-handling browser test deliberately intercepts one request with HTTP 503. It is an error-path test, not evidence of live model/database success; the other flows use the actual service.

## Fixed during verification

- PostgreSQL's isolated test cluster defaulted to SQL_ASCII; explicit UTF-8 client connections fixed decoded text-array handling.
- Adjusted cosine-test adaptation for the installed pgvector Python Vector return type.
- Disabled Leaflet zoom transition races and guarded resize cleanup when leaving a view.
- Added explicit Enter/Space activation and meaningful labels to map pins.
- Made a failed first search retry the same query instead of silently falling back to browsing.
- Increased small supporting text for mobile readability; bundled fonts for predictable loading.

## Not verified / not implemented

- **Tiger Cloud**: no service credentials were provided; no cloud provisioning, seed, query, extension installation or screenshot has been performed there.
- **Docker/Compose/Linux CI**: configurations are supplied but have not been executed. Docker is not installed on the build computer. GitHub Actions has not run because the repository is local only.
- **Public deployment**: no hosting, paid resources, public repository or hackathon submission was created.
- **Browser/device coverage**: no physical phone testing, Safari/Firefox suite, formal accessibility audit, load test or independent security audit.
- **Real location permission**: the geolocation control and failure path are implemented; obtaining the user's actual location was not requested during automated tests.
- **Trail accuracy**: starter outing metrics and park points are editorial estimates, not field-verified route data. There are no live conditions or navigation geometries.

## Artifacts

- `desktop.png` and `mobile.png`: captured from the running tested interface.
- `local-evidence.json`: redacted local vector-search output.
- Reproducible commands: README and `scripts/test-workspace.sh`.

Re-run the relevant tests after changes. Preserve the distinction between a local result and any later cloud evidence.
