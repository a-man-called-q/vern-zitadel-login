# syntax=docker/dockerfile:1
# Builds the Vern Login image from a checkout of this repository:
#   docker build -f .vern/login.Dockerfile -t vern-zitadel-login .
# The build runs once on the build platform (the output is JavaScript); the
# runtime stage follows apps/login/Dockerfile, so keep the two in step when an
# upstream release changes that file.

FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /src
ENV NX_NO_CLOUD=true \
    NX_DAEMON=false \
    NEXT_PUBLIC_BASE_PATH=/ui/v2/login
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/login/package.json apps/login/
COPY packages/zitadel-client/package.json packages/zitadel-client/
COPY packages/zitadel-proto/package.json packages/zitadel-proto/
RUN --mount=type=cache,id=vern-login-pnpm,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir /pnpm-store --filter @zitadel/login...

COPY . .
RUN pnpm exec nx run @zitadel/login:build

FROM node:24-alpine
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
# If /.env-file/.env is mounted into the container, its variables are made available to the server before it starts up.
RUN mkdir -p /.env-file && touch /.env-file/.env && chown -R nextjs:nodejs /.env-file

COPY --from=build --chown=nextjs:nodejs /src/apps/login/.next/standalone ./
# The standalone server serves static files from its own directory; the build
# script only copies them to /app/public, where they are never served.
COPY --from=build --chown=nextjs:nodejs /src/apps/login/public ./apps/login/public

USER nextjs
ENV HOSTNAME="::" \
    PORT="3000" \
    NODE_ENV="production" \
    NODE_OPTIONS="--use-openssl-ca --require /app/load-ssl-cert-dir.cjs" \
    SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt" \
    ZITADEL_TLS_ENABLED="false" \
    OTEL_SERVICE_NAME="zitadel-login" \
    OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["/usr/local/bin/node", "/app/healthcheck.mjs", "/ui/v2/login/ready"]
ENTRYPOINT ["/app/entrypoint.sh", "node", "apps/login/server.js"]
