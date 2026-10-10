import numpy as np
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from pgvector.psycopg import register_vector
from .config import MODEL_KEY

PUBLIC_COLUMNS = 'id, slug, name, area, description, duration_minutes, distance_km, difficulty, latitude, longitude, tags, scene, source_url, recorded_at'

def configure(conn):
    register_vector(conn)
    conn.execute("SET statement_timeout = '8s'")
    conn.commit()

def create_pool(url):
    return ConnectionPool(url, min_size=1, max_size=6, timeout=8,
                          kwargs={'row_factory': dict_row, 'connect_timeout': 8, 'client_encoding': 'UTF8'},
                          configure=configure, open=False)

def search_places(pool, request, vector):
    conditions = ['embedding_model = %(model)s']
    params = {'model': MODEL_KEY, 'vector': np.asarray(vector, dtype=np.float32), 'limit': request.limit}
    for field, column in [('max_minutes', 'duration_minutes <='), ('difficulty', 'difficulty ='), ('recorded_after', 'recorded_at >=')]:
        value = getattr(request, field)
        if value is not None:
            conditions.append(f'{column} %({field})s')
            params[field] = value
    distance = 'NULL::double precision'
    if request.latitude is not None:
        params.update(lat=request.latitude, lon=request.longitude)
        # Great-circle distance in km. Clamped for floating-point roundoff.
        distance = '''6371 * acos(least(1.0, greatest(-1.0,
          sin(radians(latitude))*sin(radians(%(lat)s)) +
          cos(radians(latitude))*cos(radians(%(lat)s))*cos(radians(longitude-%(lon)s)))))'''
    radius = ''
    if request.radius_km is not None:
        params['radius'] = request.radius_km
        radius = 'WHERE proximity_km <= %(radius)s'
    # SQL fragments above are fixed application strings; all user values are parameters.
    sql = f'''WITH candidates AS (
      SELECT {PUBLIC_COLUMNS}, {distance} AS proximity_km,
             1 - (embedding <=> %(vector)s) AS similarity
      FROM outdoor_places WHERE {' AND '.join(conditions)}
    ) SELECT * FROM candidates {radius} ORDER BY similarity DESC, id LIMIT %(limit)s'''
    with pool.connection() as conn:
        rows = conn.execute(sql, params).fetchall()
    for row in rows:
        row['similarity'] = round(row['similarity'], 4)
        if row['proximity_km'] is not None:
            row['proximity_km'] = round(row['proximity_km'], 2)
        # Grounded explanation: observable catalogue properties, never invented model reasoning.
        row['reasons'] = [f"{row['duration_minutes']}-minute suggested outing", f"{row['difficulty'].capitalize()} terrain", ' · '.join(row['tags'][:3])]
    return rows
