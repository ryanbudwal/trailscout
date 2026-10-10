import hashlib
import os
import re
import secrets
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from threading import Lock
from uuid import UUID, uuid4

import psycopg
from psycopg_pool import PoolTimeout
from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from .config import ROOT, MODEL_ID, MODEL_KEY, DIMENSIONS, database_url, origins
from .database import create_pool, search_places, PUBLIC_COLUMNS
from .models import Search, Walk

@asynccontextmanager
async def lifespan(app):
    from .embeddings import Encoder
    pool = create_pool(database_url())
    pool.open(wait=True)
    try:
        app.state.pool = pool
        app.state.encoder = Encoder()
        app.state.encoder.encode('A walk in nature')
        yield
    finally:
        pool.close()

app = FastAPI(title='TrailScout AI', version='1.0.0', lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=origins(), allow_credentials=True,
                   allow_methods=['GET','POST','DELETE'], allow_headers=['Content-Type'])

@app.middleware('http')
async def guard(request: Request, call_next):
    if request.method in ('POST','DELETE'):
        origin = request.headers.get('origin')
        if (origin and origin not in origins()) or request.headers.get('sec-fetch-site') == 'cross-site':
            return JSONResponse({'detail': 'Request origin not allowed.'}, status_code=403)
        if request.method == 'POST':
            if not request.headers.get('content-type', '').startswith('application/json'):
                return JSONResponse({'detail': 'Use application/json.'}, status_code=415)
            body = bytearray()
            async for chunk in request.stream():
                body.extend(chunk)
                if len(body) > 8192:
                    return JSONResponse({'detail': 'Request body too large.'}, status_code=413)
            request._body = bytes(body)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Permissions-Policy'] = 'geolocation=(self)'
    if request.url.path.startswith('/api'):
        response.headers['Cache-Control'] = 'no-store'
    return response

@app.exception_handler(psycopg.Error)
@app.exception_handler(PoolTimeout)
async def database_error(request, error):
    # Deliberately never return/log exception text: connection errors may contain secrets.
    return JSONResponse({'detail': 'The database is unavailable. Please try again shortly.'}, status_code=503)

def pool(request: Request):
    return request.app.state.pool

def owner(request: Request, response: Response):
    token = request.cookies.get('trailscout_session', '')
    if not re.fullmatch(r'[A-Za-z0-9_-]{43}', token):
        token = secrets.token_urlsafe(32)
        response.set_cookie('trailscout_session', token, httponly=True, secure=os.getenv('COOKIE_SECURE', 'false').lower() == 'true', samesite='lax', max_age=31536000, path='/api')
    return hashlib.sha256(token.encode()).hexdigest()

class RateLimit:
    def __init__(self):
        self.entries = defaultdict(deque)
        self.lock = Lock()

    def check(self, key):
        now = time.monotonic()
        with self.lock:
            # Bound state even if clients rotate addresses.
            if len(self.entries) > 10000:
                self.entries = defaultdict(deque, {k:v for k,v in self.entries.items() if v and v[-1] > now-60})
            hits = self.entries[key]
            while hits and hits[0] <= now-60:
                hits.popleft()
            if len(hits) >= 60:
                raise HTTPException(429, 'Too many searches. Try again in a minute.', headers={'Retry-After': '60'})
            hits.append(now)

limiter = RateLimit()

@app.get('/api/health')
def health(db=Depends(pool)):
    with db.connection() as conn:
        count = conn.execute('SELECT count(*) AS count FROM outdoor_places WHERE embedding_model=%s', [MODEL_KEY]).fetchone()['count']
        extension = conn.execute("SELECT extversion FROM pg_extension WHERE extname='vector'").fetchone()
    if count == 0:
        raise HTTPException(503, 'The catalogue is empty. Run the seed command.')
    return {'status':'ready', 'places':count, 'model':MODEL_ID, 'dimensions':DIMENSIONS, 'pgvector':extension['extversion']}

@app.get('/api/places')
def places(db=Depends(pool)):
    with db.connection() as conn:
        return conn.execute(f'SELECT {PUBLIC_COLUMNS} FROM outdoor_places ORDER BY id LIMIT 100').fetchall()

@app.post('/api/search')
def search(body: Search, request: Request, db=Depends(pool)):
    limiter.check(request.client.host if request.client else 'local')
    started = time.perf_counter()
    try:
        vector = request.app.state.encoder.encode(body.query)
    except Exception:
        raise HTTPException(503, 'The embedding model is unavailable. Please retry.') from None
    results = search_places(db, body, vector)
    return {'results':results, 'meta': {'model':MODEL_ID, 'dimensions':DIMENSIONS, 'metric':'cosine similarity', 'elapsed_ms':round((time.perf_counter()-started)*1000), 'filters':body.model_dump(exclude={'query','limit'}, exclude_none=True)}}

@app.get('/api/walks')
def walks(owner_hash=Depends(owner), db=Depends(pool)):
    with db.connection() as conn:
        return conn.execute('SELECT w.id, w.place_id, p.name, w.minutes, w.completed_on, w.note FROM walks w JOIN outdoor_places p ON p.id=w.place_id WHERE owner_hash=%s ORDER BY completed_on DESC, created_at DESC', [owner_hash]).fetchall()

@app.post('/api/walks', status_code=201)
def add_walk(body: Walk, owner_hash=Depends(owner), db=Depends(pool)):
    with db.connection() as conn:
        if not conn.execute('SELECT id FROM outdoor_places WHERE id=%s', [body.place_id]).fetchone():
            raise HTTPException(404, 'Place not found.')
        result = conn.execute('INSERT INTO walks (id,owner_hash,place_id,minutes,completed_on,note) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id', [uuid4(),owner_hash,body.place_id,body.minutes,body.completed_on,body.note]).fetchone()
    return result

@app.delete('/api/walks/{walk_id}', status_code=204)
def delete_walk(walk_id: UUID, owner_hash=Depends(owner), db=Depends(pool)):
    with db.connection() as conn:
        result = conn.execute('DELETE FROM walks WHERE id=%s AND owner_hash=%s RETURNING id', [walk_id,owner_hash]).fetchone()
        if not result:
            raise HTTPException(404, 'Walk not found.')
    return Response(status_code=204)

# A single origin production build avoids CORS and separate frontend hosting.
dist = ROOT / 'frontend/dist'
if dist.exists():
    app.mount('/assets', StaticFiles(directory=dist / 'assets'), name='assets')
    @app.get('/')
    def frontend():
        return FileResponse(dist / 'index.html')
    @app.get('/favicon.svg')
    def favicon():
        return FileResponse(dist / 'favicon.svg')
