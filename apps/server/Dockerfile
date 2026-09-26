# syntax=docker/dockerfile:1
#
# Multi-stage build for @campus/server. Built from the MONOREPO ROOT as
# the build context (docs/architecture.md §23.2 "Docker"):
#   docker build -f apps/server/Dockerfile .
#
# This copies the whole workspace rather than using `pnpm deploy`'s
# standalone-package extraction, because the repo uses
# `node-linker=hoisted` (.npmrc, for Expo/RN compatibility) and a single
# flat node_modules is the simplest thing that reliably works with that
# linker — see docs/adr/0009-s3mock-instead-of-minio-locally.md-style
# reasoning: pick the option that's actually verified to work over the
# theoretically more minimal one.

FROM node:24-slim AS base
# Prisma's engines need libssl to detect the OpenSSL version at runtime —
# without it they default to a guess ("openssl-1.1.x") and warn on every
# invocation; node:24-slim (Debian) doesn't include it by default.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

# --- deps: install once, cached unless a manifest changes ---
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/server/package.json apps/server/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile

# --- build: generate the Prisma client ---
FROM deps AS build
COPY packages ./packages
COPY apps/server ./apps/server
# `prisma generate` only needs the schema, not a live database — this
# placeholder satisfies prisma.config.js's `datasource.url` resolution at
# codegen time without requiring network access during the image build.
# The Prisma schema/client now live in @campus/database (see
# docs/adr/0011-separate-database-package.md), not @campus/server.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN pnpm --filter @campus/database exec prisma generate

# --- runtime: non-root, only what's needed to run the server ---
FROM base AS runtime
ENV NODE_ENV=production
RUN groupadd --system app && useradd --system --gid app --create-home app
WORKDIR /repo
COPY --from=build --chown=app:app /repo/node_modules ./node_modules
COPY --from=build --chown=app:app /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=build --chown=app:app /repo/packages ./packages
COPY --from=build --chown=app:app /repo/apps/server ./apps/server
USER app
WORKDIR /repo/apps/server
EXPOSE 3000
CMD ["node", "src/server.js"]
