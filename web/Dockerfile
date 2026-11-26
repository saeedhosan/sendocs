# syntax=docker/dockerfile:1

# Debian (glibc) instead of Alpine (musl): Playwright's Chromium
# binary requires glibc, so the dev image can run the e2e suite.
FROM oven/bun:1-debian AS base

WORKDIR /app

FROM base AS deps

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

FROM deps AS dev

ENV PORT=3000

# Playwright is needed only by the dev image for the test suite.
RUN bunx playwright install --with-deps chromium

COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]

FROM deps AS build

COPY . .

RUN bun run build

FROM nginx:1-alpine AS prod

ENV PORT=3000

COPY docker/nginx-main.conf /etc/nginx/nginx.conf
COPY docker/log-format.conf /etc/nginx/conf.d/00-log-format.conf
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN nginx -t

EXPOSE 3000
