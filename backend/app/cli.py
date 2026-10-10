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
        stats = conn.execute('SELECT count(*) AS places, min(vector_dims(embedding)) AS dimensions FROM outdoor_places').fetchone()
    request = Search(query='a peaceful shaded walk among trees', max_minutes=60, difficulty='easy')
    results = search_places(pool, request, Encoder().encode(request.query))
    pool.close()
    print(json.dumps({'extensions': extensions, 'catalogue': stats, 'model': MODEL_KEY, 'query': request.model_dump(mode='json'), 'results': [{'name': p['name'], 'similarity': p['similarity']} for p in results[:5]]}, indent=2))

if __name__ == '__main__':
    commands = {'migrate': migrate, 'seed': seed, 'evidence': evidence}
    if len(sys.argv) != 2 or sys.argv[1] not in commands:
        raise SystemExit('Usage: python -m app.cli migrate|seed|evidence')
    commands[sys.argv[1]]()
