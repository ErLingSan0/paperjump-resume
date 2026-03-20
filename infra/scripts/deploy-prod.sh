#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

BRANCH="${DEPLOY_BRANCH:-main}"
ENV_FILE="${DEPLOY_ENV_FILE:-${PROJECT_DIR}/infra/.env.prod}"
COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-${PROJECT_DIR}/infra/docker-compose.prod.yml}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-http://127.0.0.1/api/system/info}"
HEALTH_ATTEMPTS="${DEPLOY_HEALTH_ATTEMPTS:-45}"
HEALTH_SLEEP="${DEPLOY_HEALTH_SLEEP:-2}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed or not in PATH" >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "missing env file: ${ENV_FILE}" >&2
  exit 1
fi

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "missing compose file: ${COMPOSE_FILE}" >&2
  exit 1
fi

cd "${PROJECT_DIR}"

if [[ "${DEPLOY_SKIP_GIT_SYNC:-0}" != "1" ]]; then
  git fetch origin "${BRANCH}"
  git checkout "${BRANCH}"
  git reset --hard "origin/${BRANCH}"
fi

export APP_VERSION="${APP_VERSION:-$(git rev-parse --short HEAD)}"

compose_cmd=(
  docker
  compose
  --env-file "${ENV_FILE}"
  -f "${COMPOSE_FILE}"
)

"${compose_cmd[@]}" up -d --build --remove-orphans
"${compose_cmd[@]}" ps

if command -v curl >/dev/null 2>&1; then
  for (( attempt=1; attempt<=HEALTH_ATTEMPTS; attempt++ )); do
    if curl -fsS "${HEALTH_URL}" >/dev/null; then
      echo "deployment healthy after ${attempt} checks"
      exit 0
    fi

    sleep "${HEALTH_SLEEP}"
  done

  echo "health check failed: ${HEALTH_URL}" >&2
  "${compose_cmd[@]}" logs --tail=120 api web || true
  exit 1
fi

echo "curl not installed, skipped health check"
