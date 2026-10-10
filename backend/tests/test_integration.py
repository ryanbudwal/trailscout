"""Real-model, real-Postgres tests. Run against a migrated and seeded test database."""
from datetime import datetime, timedelta, timezone
import numpy as np
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import app, limiter
from app.models import Search
from app.config import MODEL_KEY
from app.evaluation import evaluate_retrieval, keyword_score

@pytest.fixture(scope='module')
def client():
    with TestClient(app) as client:
        yield client

@pytest.fixture(autouse=True)
def clear_limiter():
    limiter.entries.clear()

def search(client, query='a quiet walk among trees', **filters):
    response = client.post('/api/search', json={'query':query, **filters})
    assert response.status_code == 200, response.text
    return response.json()

def test_ready_and_real_vectors(client):
    health = client.get('/api/health').json()
    assert health['places'] == 24 and health['dimensions'] == 384
    vector = np.array(app.state.encoder.encode('A peaceful forest'))
    assert vector.shape == (384,)
    assert np.linalg.norm(vector) == pytest.approx(1, abs=1e-5)
    with app.state.pool.connection() as conn:
        row = conn.execute('SELECT count(*) AS count FROM outdoor_places WHERE vector_dims(embedding)=384 AND embedding_model=%s', [MODEL_KEY]).fetchone()
    assert row['count'] == 24

@pytest.mark.parametrize('query,expected_tags', [
    ('somewhere quiet under a leafy canopy', {'Woodland','Forest','Shade','Trees'}),
    ('open water and sunset photography on the lake shore', {'Sunset','Lake views','Photography','Beach'}),
    ('watch waterbirds among wetland reeds', {'Birdwatching','Wetlands','Ponds'}),
])
def test_semantic_relevance(client, query, expected_tags):
    rows = search(client, query)['results']
    assert len(rows) > 0
    assert len([p for p in rows[:3] if expected_tags.intersection(p['tags'])]) >= 2
    assert rows[0]['similarity'] > rows[-1]['similarity']

def test_filters_and_distance(client):
    rows = search(client, max_minutes=45, difficulty='easy', latitude=43.6532,longitude=-79.3832,radius_km=6)['results']
    assert rows
    for row in rows:
        assert row['duration_minutes'] <= 45
        assert row['difficulty'] == 'easy'
        assert row['proximity_km'] <= 6
        assert row['reasons'][0] == 'Fits inside your 45-minute limit'
        assert row['reasons'][1] == 'Matches your easy difficulty filter'
    assert not search(client, latitude=0,longitude=0,radius_km=1)['results']

def test_time_filter(client):
    assert search(client, recorded_after='2000-01-01T00:00:00Z')['results']
    tomorrow=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()
    assert search(client, recorded_after=tomorrow)['results'] == []

@pytest.mark.parametrize('body', [
    {'query':'  '},{'query':'x'*501},{'query':'trees','max_minutes':-1},
    {'query':'trees','latitude':91,'longitude':0},
    {'query':'trees','radius_km':10},{'query':'trees','difficulty':'extreme'},
    {'query':'trees','recorded_after':'2026-01-01T00:00:00'},
    {'query':'trees','latitude':float('inf'),'longitude':0},
])
def test_input_validation(body):
    with pytest.raises(ValidationError): Search(**body)

def test_injection_is_data(client):
    assert search(client, query="trees'; DROP TABLE outdoor_places; --")['results']
    assert client.get('/api/health').status_code == 200

def test_cosine_matches_direct_math(client):
    query='gentle lake views'
    vector=np.array(app.state.encoder.encode(query))
    row=search(client,query)['results'][0]
    with app.state.pool.connection() as conn:
        db_vector=conn.execute('SELECT embedding FROM outdoor_places WHERE id=%s',[row['id']]).fetchone()['embedding'].to_numpy()
    expected=float(np.dot(vector,db_vector)/(np.linalg.norm(vector)*np.linalg.norm(db_vector)))
    assert row['similarity'] == pytest.approx(expected, abs=0.0001)

def test_retrieval_evaluation_is_reproducible(client):
    report = evaluate_retrieval(app.state.pool, app.state.encoder)
    assert len(report['queries']) == 4
    assert 0 <= report['summary']['semantic_mean_relevant_at_3'] <= 3
    assert 0 <= report['summary']['keyword_mean_relevant_at_3'] <= 3
    assert len({case['semantic']['top_5'][0]['name'] for case in report['queries']}) >= 3
    example = {'name':'Tall trees', 'description':'A quiet forest', 'tags':['Shade']}
    assert keyword_score('quiet trees', example) == 1

def test_walk_lifecycle_and_isolation(client):
    client.get('/api/walks')
    payload={'place_id':1,'minutes':43,'completed_on':datetime.now(timezone.utc).date().isoformat(),'note':'Integration test: birds in the canopy.'}
    response=client.post('/api/walks',json=payload)
    assert response.status_code==201
    walk_id=response.json()['id']
    try:
        assert any(w['id']==walk_id for w in client.get('/api/walks').json())
        # No cookie: a different anonymous visitor cannot see or delete this walk.
        other=TestClient(app)
        assert all(w['id']!=walk_id for w in other.get('/api/walks').json())
        assert other.delete('/api/walks/'+walk_id).status_code==404
        # Reconnect with the same session: storage survives a new client.
        reconnect=TestClient(app,cookies=client.cookies)
        assert any(w['id']==walk_id for w in reconnect.get('/api/walks').json())
    finally:
        assert client.delete('/api/walks/'+walk_id).status_code==204
    assert client.delete('/api/walks/'+walk_id).status_code==404

def test_bad_walk_and_origin(client):
    data={'place_id':99999,'minutes':20,'completed_on':'2020-01-01'}
    assert client.post('/api/walks',json=data).status_code==404
    data['minutes']=0
    assert client.post('/api/walks',json=data).status_code==422
    assert client.post('/api/search',json={'query':'trees'},headers={'Origin':'https://attacker.example'}).status_code==403
    assert client.post('/api/search',content='x'*9000,headers={'Content-Type':'application/json'}).status_code==413
    assert client.post('/api/search',content='not-json').status_code==415

def test_cookie_and_security_headers(client):
    client.cookies.clear()
    response=client.get('/api/walks')
    assert 'HttpOnly' in response.headers['set-cookie']
    assert 'SameSite=lax' in response.headers['set-cookie']
    assert response.headers['cache-control']=='no-store'
    assert response.headers['x-content-type-options']=='nosniff'

def test_rate_limit(client):
    for _ in range(60): limiter.check('testclient')
    assert client.post('/api/search',json={'query':'trees'}).status_code==429

def test_model_failure_has_no_fake_results(client, monkeypatch):
    def unavailable(text):
        raise RuntimeError('internal-model-detail')
    monkeypatch.setattr(app.state.encoder, 'encode', unavailable)
    response=client.post('/api/search',json={'query':'trees'})
    assert response.status_code==503
    assert 'internal-model-detail' not in response.text
    assert 'results' not in response.json()

def test_database_error_is_redacted(client):
    import psycopg
    from app.main import pool
    def unavailable():
        raise psycopg.OperationalError('database-password-must-never-leak')
    app.dependency_overrides[pool]=unavailable
    try:
        response=client.get('/api/health')
        assert response.status_code==503
        assert 'database-password-must-never-leak' not in response.text
    finally:
        app.dependency_overrides.clear()
