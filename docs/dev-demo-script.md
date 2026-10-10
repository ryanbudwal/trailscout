# DEV Touch Grass demo script

Target length: **75–90 seconds**. Record at 1440×900 or similar, increase browser zoom only if text is hard to read, and hide bookmarks, notifications, credentials and unrelated tabs.

## Shot list and narration

| Time | Screen action | Narration |
|---|---|---|
| 0–8 s | Open the cinematic Explore screen; pause briefly on “Find your outside.” | “TrailScout turns the outdoor break in your head into a place you can actually choose.” |
| 8–22 s | Enter `somewhere by the water to watch the sunset`; choose Easy and Up to 45 min; search. | “An open-weight MiniLM model turns this request into 384 numbers. PostgreSQL with pgvector ranks authored place descriptions by cosine similarity while SQL enforces my exact limits.” |
| 22–36 s | Show the changed cards and map. Expand the semantic-search proof. | “This is real vector search, not keyword-styled mock data. The score is similarity, not confidence, and the model revision and query time are visible.” |
| 36–50 s | Open the first result. Pause on “Why it might fit,” then use “Open location.” | “The explanation uses stored duration, difficulty and tags. TrailScout does not invent routes or live conditions. When a place fits, the next action is opening its real location and leaving the app.” |
| 50–62 s | Return, search `a place to spot birds and explore wetlands`, and show the different first results. | “A different meaning produces a different ranking. The small published evaluation also shows the limitation: semantic search did not beat a keyword baseline on every query.” |
| 62–76 s | **After Tiger verification:** show the prepared Tiger Cloud SQL results screenshot or live console. | “These 24 MiniLM vectors are stored in Tiger Cloud with their metadata. This read-only evidence confirms 384 dimensions, pgvector, TLS and the same filtered cosine query.” |
| 76–86 s | Show GitHub Actions success and the test counts in the README/verification record. | “The real-model integration suite, desktop and mobile browser flows, production build and public GitHub Action all pass.” |
| 86–90 s | Return to the hero or show an actual outdoor-use photo if one exists. | “Describe the feeling, choose a place, and go outside.” |

## If Tiger Cloud is not verified

Replace the 62–76 second segment with local PostgreSQL evidence and say “local PostgreSQL with pgvector.” Do not show the Tiger Data category in the article or imply that the local database is Tiger Cloud. Keep the final video closer to 75 seconds.

## Capture checklist

- Preload the model and run one search before recording so startup work is complete.
- Reset filters and browser state; remove private journal notes.
- Keep the app's motion control visible but pause motion if it hurts compression/readability.
- Confirm the OpenStreetMap link opens the intended approximate park location.
- Use the actual Tiger Cloud screenshots from `docs/tiger-cloud-evidence.md`; never record `.env` or a connection URL.
- Add captions. Avoid background music unless its license permits redistribution.
- If including an outdoor photo, use one you took or have permission to publish.
