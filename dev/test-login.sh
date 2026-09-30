#!/usr/bin/env bash
# Builds the Login image, starts dev/compose.yml in an isolated project and runs
# the Vern Playwright checks against it. Needs Node.js, pnpm and Docker, and the
# workspace dependencies installed with:
#   pnpm install --frozen-lockfile --filter @zitadel/login...

set -euo pipefail

cd "$(dirname "$0")/.."

export AUTH_HTTP_PORT="${AUTH_LOGIN_TEST_PORT:-80}"
export ZITADEL_LOGIN_IMAGE="vern-zitadel-login:local"
export ZITADEL_VERSION="$(<.vern/UPSTREAM_VERSION)"
login_route_host="${AUTH_LOGIN_TEST_HOST:-localhost}"
export ZITADEL_DOMAIN="$login_route_host"
export NX_DAEMON=false
export NX_TUI=false
export NX_NO_CLOUD=true
# PNPM may otherwise run a full monorepo install before exec when this checkout
# was installed with a filtered workspace.
export pnpm_config_verify_deps_before_run="${pnpm_config_verify_deps_before_run:-warn}"

compose=(docker compose --project-name vern-login-test -f dev/compose.yml)

cleanup() {
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

NEXT_PUBLIC_BASE_PATH=/ui/v2/login ./node_modules/.bin/nx run @zitadel/login:build
docker build -f apps/login/Dockerfile -t "$ZITADEL_LOGIN_IMAGE" apps/login
"${compose[@]}" up -d --wait

curl_args=()
if [[ "$login_route_host" == "localhost" && "$(uname -s)" == "Darwin" ]]; then
  export LOGIN_LOCALHOST_IPV6=true
  curl_args+=(--ipv6)
else
  export LOGIN_LOCALHOST_IPV6=false
fi
if [[ "$AUTH_HTTP_PORT" != "80" ]]; then
  echo "The isolated browser test must use host port 80 so the Host header matches the configured Traefik router."
  echo "Free port 80 or set AUTH_LOGIN_TEST_PORT=80; a nonstandard port adds a port to Host and misses the localhost router."
  exit 2
fi
login_url="http://${login_route_host}:${AUTH_HTTP_PORT}/ui/v2/login/"
curl "${curl_args[@]}" --fail --silent --show-error --retry 20 --retry-all-errors --retry-delay 3 \
  "${login_url}ready" >/dev/null
(
  cd apps/login
  LOGIN_BASE_URL="$login_url" ./node_modules/.bin/playwright test --config acceptance/vern-playwright.config.ts
)
