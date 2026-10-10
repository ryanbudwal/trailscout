#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
runtime_dir="$(cd "$project_dir/../.." && pwd)/work"
cd "$project_dir"
export DATABASE_URL=postgresql://trailscout@127.0.0.1:55432/trailscout
export HF_HOME="$runtime_dir/huggingface"
export HF_HUB_OFFLINE=1
export PYTHONPATH="$project_dir/backend"
"$runtime_dir/venv/bin/python" -m pytest backend/tests -q
cd frontend
npm run build
PLAYWRIGHT_BROWSERS_PATH="$runtime_dir/browsers" npm run test:e2e
