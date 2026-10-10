import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / '.env')
MODEL_ID = 'sentence-transformers/all-MiniLM-L6-v2'
MODEL_REVISION = '1110a243fdf4706b3f48f1d95db1a4f5529b4d41'
MODEL_KEY = f'{MODEL_ID}@{MODEL_REVISION}'
DIMENSIONS = 384

def database_url():
    value = os.getenv('DATABASE_URL')
    if not value:
        raise RuntimeError('Set DATABASE_URL in the project .env file before starting.')
    return value

def origins():
    return [x.strip() for x in os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000').split(',')]
