FROM node:22-bookworm-slim AS frontend
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    HF_HOME=/app/.cache/huggingface HF_HUB_DISABLE_TELEMETRY=1 \
    PYTHONPATH=/app/backend PORT=8000
WORKDIR /app
COPY backend/requirements-lock.txt /app/backend/requirements-lock.txt
# Use CPU wheels on Linux; no CUDA runtime is needed for this small model.
RUN pip install --no-cache-dir torch==2.14.1 --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r backend/requirements-lock.txt
COPY backend /app/backend
COPY db /app/db
COPY --from=frontend /web/dist /app/frontend/dist
RUN python -c "from app.embeddings import Encoder; Encoder().encode('A walk in nature')" \
    && useradd --create-home --uid 10001 trailscout \
    && chown -R trailscout:trailscout /app
ENV HF_HUB_OFFLINE=1
USER trailscout
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
