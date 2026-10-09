# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

FROM deps AS dev

ENV PORT=3000

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