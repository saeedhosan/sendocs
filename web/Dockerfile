# syntax=docker/dockerfile:1

# Debian (glibc) instead of Alpine (musl): Playwright's Chromium is a glibc
# binary and will not run on musl, so the dev image needs a glibc base to be
# able to run the e2e part of `bun run test`.
FROM oven/bun:1-debian AS base

WORKDIR /app

FROM base AS deps

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

FROM deps AS dev

ENV PORT=3000

# Playwright browser + OS dependencies, used by `bun run test` (the script runs
# lint, unit, and the Playwright e2e suite). Only the dev image carries these;
# the prod target is plain nginx and never installs Playwright.
RUN bunx playwright install --with-deps chromium

COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]

FROM deps AS build

COPY . .

RUN bun run build

FROM nginx:1-alpine AS prod

ENV PORT=80

COPY docker/log-format.conf /etc/nginx/conf.d/00-log-format.conf
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN nginx -t

EXPOSE 80
