"""Explicit, idempotent schema/seed and redacted evidence commands."""
import json
import sys
import psycopg
from pgvector.psycopg import register_vector
from .config import ROOT, MODEL_KEY, database_url

def migrate():
    with psycopg.connect(database_url(), client_encoding='UTF8') as conn:
        conn.execute((ROOT / 'db/001_initial.sql').read_text())
    print('Schema ready.')

def seed():
    from .embeddings import Encoder
    places = json.loads((ROOT / 'backend/app/places.json').read_text())
    model = Encoder()
    texts = [f"{p['name']}. {p['description']} {' '.join(p['tags'])}" for p in places]
    vectors = model.batch(texts)
    fields = ['slug','name','area','description','duration_minutes','distance_km','difficulty','latitude','longitude','tags','scene','source_url']
    with psycopg.connect(database_url(), client_encoding='UTF8') as conn:
        register_vector(conn)
        for p, vector in zip(places, vectors, strict=True):
            columns = fields + ['embedding_model', 'embedding']
            # Only known column identifiers are interpolated; values are bound.
            conn.execute(f"INSERT INTO outdoor_places ({','.join(columns)}) VALUES ({','.join(['%s']*len(columns))}) ON CONFLICT (slug) DO UPDATE SET " + ','.join(f'{x}=EXCLUDED.{x}' for x in columns if x != 'slug'), [p[k] for k in fields] + [MODEL_KEY, vector])
    print(f'Seeded {len(places)} real MiniLM vectors ({vectors.shape[1]} dimensions).')

def evidence():
    from .database import create_pool, search_places
    from .embeddings import Encoder
    from .models import Search
    from psycopg.rows import dict_row
    pool = create_pool(database_url())
    pool.open(wait=True)
    with pool.connection() as conn:
        extensions = conn.execute("SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector','vectorscale','timescaledb')").fetchall()
        stats = conn.execute('SELECT count(*) AS places, min(vector_dims(embedding)) AS min_dimensions, max(vector_dims(embedding)) AS max_dimensions, count(DISTINCT embedding_model) AS embedding_models FROM outdoor_places').fetchone()
        server = conn.execute("SELECT current_database() AS database, current_setting('server_version') AS server_version").fetchone()
        tls = conn.execute("SELECT ssl, version, cipher FROM pg_stat_ssl WHERE pid=pg_backend_pid()").fetchone()
    encoder = Encoder()
    searches = []
    for query in [
        'a peaceful shaded walk among trees',
        'somewhere by the water to watch the sunset',
        'a place to spot birds and explore wetlands',
    ]:
        request = Search(query=query, limit=5)
        results = search_places(pool, request, encoder.encode(query))
        searches.append({
            'query': query,
            'results': [
                {'name': place['name'], 'similarity': place['similarity']}
                for place in results
            ],
        })
    pool.close()
    extension_names = {row['extname'] for row in extensions}
    print(json.dumps({
        'connection': {**server, 'tls': tls},
        'extensions': extensions,
        'catalogue': stats,
        'model': MODEL_KEY,
        'searches': searches,
        'checks': {
            'tls_enabled': bool(tls and tls['ssl']),
            'vector_extension_present': 'vector' in extension_names,
            'all_vectors_are_384_dimensions': stats['min_dimensions'] == 384 and stats['max_dimensions'] == 384,
            'single_embedding_model': stats['embedding_models'] == 1,
        },
        'claim_boundary': 'This output identifies database capabilities and results. Call it Tiger Cloud evidence only when the command was run against your verified Tiger Cloud service.',
    }, indent=2))

def evaluate():
    from .database import create_pool
    from .embeddings import Encoder
    from .evaluation import evaluate_retrieval
    pool = create_pool(database_url())
    pool.open(wait=True)
    try:
        result = evaluate_retrieval(pool, Encoder())
    finally:
        pool.close()
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    commands = {'migrate': migrate, 'seed': seed, 'evidence': evidence, 'evaluate': evaluate}
    if len(sys.argv) != 2 or sys.argv[1] not in commands:
        raise SystemExit('Usage: python -m app.cli migrate|seed|evidence|evaluate')
    commands[sys.argv[1]]()
