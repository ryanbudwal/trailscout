# Data and asset provenance

## Starter catalogue

`backend/app/places.json` contains 24 original, AI-assisted editorial outing descriptions associated with real Toronto-area public parks. They are a small demonstrator catalogue, not an authoritative trail dataset.

- Names refer to real places; headings such as “woodland wander” are original suggested-outing names, not official trail names.
- Coordinates are approximate park points, not verified entrances or navigation waypoints.
- Durations, distances, difficulty and tags are editorial estimates. They have not been field surveyed or verified against an authoritative route geometry.
- The source link goes to Toronto's [parks and trails information directory](https://www.toronto.ca/explore-enjoy/parks-recreation/places-spaces/parks-trails/). It is a visitor-information reference, not evidence for each estimated metric. Check the relevant park authority for the latest details, especially parks outside the City's management such as Rouge National Urban Park.
- No text, route geometry or photographs were scraped from the reference designs. Current conditions, operating hours, permitted activities and closures are not in this dataset.
- `recorded_at` is assigned by the database at first seed. It is an ingestion timestamp, not a field observation.

A production catalogue should replace estimates with sourced, licensed and regularly maintained records, retaining data provenance and revision dates. Do not market the starter data as verified navigation information.

## Visual assets

- All landscapes are original SVG illustrations implemented in `frontend/src/Scene.tsx`, generated from code with Codex assistance. They depict generic landscape types, not photographic evidence of each park.
- The brand symbol is rendered using Lucide's Mountain icon; Lucide icons retain the [ISC license](https://github.com/lucide-icons/lucide/blob/main/LICENSE).
- DM Sans and Manrope are bundled through Fontsource and retain their SIL Open Font License. License files are included in their npm packages. No external font requests are required at runtime.
- Leaflet retains its BSD-2-Clause license.
- OpenStreetMap map data is © OpenStreetMap contributors, available under ODbL. The UI preserves attribution. Public tile-server use is subject to the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/); use an appropriate tile provider before scaling a public deployment. The app does not bulk download or prefetch tiles for offline use.
- User-supplied design references inspired the layout, palette and nature theme only. Those images are not redistributed or used as application assets.

## Model

[all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) is Apache-2.0 licensed. The model revision is pinned in `backend/app/config.py`; the model card documents its training, intended use and limitations. We do not train a new model or claim ownership of its weights.

## Runtime privacy

Search text and optional location go to this application's backend. They are not forwarded to a hosted AI API. The process caches up to 128 query embeddings in memory. OpenStreetMap receives tile requests from the browser, which reveal the viewed map area and ordinary network metadata. Journal records contain the user's entered date, duration and note, linked to a hash of a random anonymous session token. Bookmarks remain in localStorage.
