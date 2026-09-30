#!/usr/bin/env bash
# Builds the Login image, starts dev/compose.yml in an isolated project and runs
# the Vern Playwright checks against it. Needs only Docker: the build and the
# browser run in containers, and the browser reaches the stack inside its
# network as http://login.test, so no host port or local Node.js is involved.

set -euo pipefail

cd "$(dirname "$0")/.."

project="vern-login-test"
domain="login.test"
image="vern-zitadel-login:test"
playwright="$(grep -oE '@playwright/test@[0-9]+\.[0-9]+\.[0-9]+' pnpm-lock.yaml | head -1 | cut -d@ -f3)"

export ZITADEL_VERSION="$(<.vern/UPSTREAM_VERSION)"
export ZITADEL_LOGIN_IMAGE="$image"
export ZITADEL_DOMAIN="$domain"
export AUTH_EXTERNAL_PORT=80
# Published only because the proxy always publishes; the test does not use it.
export AUTH_HTTP_PORT="${AUTH_LOGIN_TEST_PORT:-18081}"

compose=(docker compose --project-name "$project" -f dev/compose.yml)

cleanup() {
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker build -f .vern/login.Dockerfile -t "$image" .
"${compose[@]}" up -d --wait

proxy_ip="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$("${compose[@]}" ps -q proxy)")"

docker run --rm \
  --network "${project}_default" \
  --add-host "${domain}:${proxy_ip}" \
  --volume "$PWD/apps/login/acceptance/vern-playwright.config.ts:/work/vern-playwright.config.ts:ro" \
  --volume "$PWD/apps/login/acceptance/tests/vern-login.spec.ts:/work/tests/vern-login.spec.ts:ro" \
  --env "LOGIN_BASE_URL=http://${domain}/ui/v2/login/" \
  --workdir /work \
  "mcr.microsoft.com/playwright:v${playwright}-noble" \
  sh -c "
    npm install --silent --no-save --no-package-lock @playwright/test@${playwright} &&
    node -e '
      const url = process.env.LOGIN_BASE_URL + \"ready\";
      (async () => {
        for (let i = 0; i < 60; i++) {
          try { if ((await fetch(url)).ok) return; } catch {}
          await new Promise((r) => setTimeout(r, 2000));
        }
        console.error(\"The Login App did not become ready at \" + url);
        process.exit(1);
      })();
    ' &&
    npx playwright test --config vern-playwright.config.ts
  "
