#!/usr/bin/env bash
# Convenience launcher for the isolated runtime prepared in this Codex workspace.
# For a fresh clone, follow README.md instead.
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
runtime_dir="$(cd "$project_dir/../.." && pwd)/work"
if [[ ! -x "$runtime_dir/venv/bin/python" || ! -x "$runtime_dir/pgsql/bin/pg_ctl" ]]; then
  echo 'Workspace runtime not found. Use the native setup in README.md.' >&2
  exit 1
fi
cd "$project_dir"
if ! "$runtime_dir/pgsql/bin/pg_ctl" -D "$runtime_dir/pgdata" status >/dev/null 2>&1; then
  "$runtime_dir/pgsql/bin/pg_ctl" -D "$runtime_dir/pgdata" -l "$runtime_dir/postgres.log" -o "-p 55432 -h 127.0.0.1 -k ''" start
fi
export DATABASE_URL=postgresql://trailscout@127.0.0.1:55432/trailscout
export HF_HOME="$runtime_dir/huggingface"
export HF_HUB_OFFLINE=1
export PYTHONPATH="$project_dir/backend"
echo 'TrailScout: http://127.0.0.1:8000 — press Ctrl+C to stop the web server.'
exec "$runtime_dir/venv/bin/python" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
