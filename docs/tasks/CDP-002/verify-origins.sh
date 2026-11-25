#!/usr/bin/env bash
# Run from the repository root in a clean checkout. No existing API, Vite or
# database ports are taken. The browser sees the real loopback origins in its
# private Docker network namespace, shared with this test's API.
set -euo pipefail
test ! -e .env && test ! -e web/.env
echo 'No root or web .env present'
unset CORS_ORIGINS API_PORT APP_ENV DRAFT_PREVIEW_TOKEN POSTGRES_USER POSTGRES_DB POSTGRES_PASSWORD
project="cdp002proof$(python3 -c 'import uuid; print(uuid.uuid4().hex[:12])')"
scratch=$(mktemp -d)
browser="$project-browser"
compose=(docker compose -p "$project" -f docker-compose.yml -f "$scratch/ports.yml")
cat > "$scratch/ports.yml" <<EOF
services:
  db:
    container_name: $project-db
    ports: !reset []
  api:
    container_name: $project-api
    ports: !reset []
EOF
cleanup() {
  docker rm -f "$browser" >/dev/null 2>&1 || true
  "${compose[@]}" down --volumes --rmi local
  docker image rm "$browser" >/dev/null 2>&1 || true
  rm -rf "$scratch"
}
trap cleanup EXIT
set -x
npm ci --prefix web
VITE_CREATOR_SLUG=demo VITE_DATA_MODE=api VITE_API_BASE_URL=http://localhost:8000 npm run build --prefix web
"${compose[@]}" up --build --wait db api
"${compose[@]}" exec -T api alembic upgrade head
"${compose[@]}" exec -T api python -m app.seed_demo
"${compose[@]}" exec -T api printenv CORS_ORIGINS
docker build -t "$browser" - <<'DOCKER'
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends chromium && rm -rf /var/lib/apt/lists/*
DOCKER
docker run -d --name "$browser" --network "container:$project-api" "$browser" sleep 600
docker cp web/dist "$browser:/site"
docker cp docs/tasks/CDP-002/check_origins.py "$browser:/check_origins.py"
docker exec "$browser" python /check_origins.py
