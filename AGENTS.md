# AGENTS.md

Sendocs: Laravel 13 API (`api/`) + React 19 SPA (`web/`), orchestrated by root `compose.yaml`.

## Root is a command surface only

Root `package.json` has no dependencies and no lockfile — it exists to delegate. Each surface owns its
deps, tests, lint, and Dockerfile. Never add app config to root.

| Command | Runs |
| :-- | :-- |
| `npm run setup` | `cp -n` env files, build images, migrate |
| `npm run dev` | api + web + worker + db |
| `npm run dev:api` / `dev:web` / `dev:worker` | subsets |
| `npm run build` | `docker compose build` |
| `npm run start` | run built images, no rebuild |
| `npm run migrate` | `artisan migrate --force` against local db |
| `npm run lint` | `pint --test` (api) + `eslint . && tsc -b` (web) |
| `npm run test` | `artisan test` (api) + web `test` script |
| `npm run compose -- <args>` | raw compose escape hatch — use for anything not above |

## Everything runs in Docker

No host PHP, Composer, Bun, or PostgreSQL. Any ad-hoc command must go through a container:

```bash
npm run compose -- run --rm api php artisan test --filter=SomeName
npm run compose -- run --rm api php artisan route:list --path=api
npm run compose -- run --rm web bunx eslint src/App.tsx
npm run compose -- run --rm api vendor/bin/pint --dirty
```

`composer test` runs `artisan config:clear` then the whole suite — it is not a focused runner.
Use `php artisan test <path>` / `--filter=` for a single test. Use `pint --dirty` to fix style;
`composer lint` only reports (`--test`).

## Dev loop: docs are stale here, trust compose.yaml

`README.md` (Commands section) and `docs/structure.md` (Containers) both say source is **not**
bind-mounted and that `npm run build` must be re-run to see a change. That is out of date.
`compose.yaml` bind-mounts `./api:/var/www/html` and `./web:/app`, so PHP and Vite edits are live.

What still requires `npm run build`:

- `api/composer.json`, `web/package.json` — `vendor/` and `node_modules/` are anonymous volumes seeded
  from the image, so a **newly added dependency is invisible until rebuild**.
- `api/Dockerfile`, `web/Dockerfile`, `api/docker/php.ini`, `web/docker/nginx.conf`.

`docs/structure.md`'s "Compose Variables" table is also wrong: it lists `SENDOCS_API_IMAGE`,
`SENDOCS_WEB_IMAGE`, `SENDOCS_API_TARGET`, `SENDOCS_WEB_TARGET`. `compose.yaml` reads none of those
— it always builds from source with `API_TARGET`/`WEB_TARGET` (default `dev`), and `WEB_PORT`/`API_PORT`
change only the host side; container ports are hardcoded (api `8000`/`9000`, web `3000`).

## One origin for the browser

Browser uses `http://localhost:3000` only; `/api` and `/health` are proxied to the API (Vite in dev,
nginx in prod). Cookies/CSRF therefore behave identically in both. `127.0.0.1:8000` exists for `curl`
and Laravel's own HTTP client.

`web/docker/nginx.conf` hardcodes the `api` service name and its `9000` PHP-FPM port. Renaming the
compose service means editing that file.

## Two known gaps — check before assuming they work

- `api/bootstrap/app.php` registers **only** `routes/web.php` plus Laravel's health route at `/up`.
  There is no `routes/api.php`, so no `/api/v1/*` route resolves until you create the file and pass
  `api:` to `withRouting()`.
- Vite and nginx proxy `/health`, and `docs/design.md` + `docs/openapi.yaml` specify `GET /health`,
  but no `/health` route exists. It will 404 until implemented.

## Testing quirks

- Dev runs PostgreSQL; **tests run sqlite `:memory:`** (`api/phpunit.xml`). Migrations must pass on both.
- `RefreshDatabase` is commented out in `api/tests/Pest.php`. Enable it before writing DB-backed
  feature tests.
- There is no web test runner. `web`'s `test` script is `eslint .`, so `npm run test` currently runs
  no web tests at all. `npm run lint` is the only real web check (`eslint` + `tsc -b`).
- No static analysis is configured for the API — Pint is the whole of `npm run lint`.

## Docs are the spec, and each doc owns its rules

One doc per feature; a rule or shared number lives in exactly one place. Before implementing, read
the owning doc in `docs/features/`. **Any API change updates the owning doc and `docs/openapi.yaml`** —
they are the contract, not commentary.

Numbers owned by `docs/openapi.yaml` / `docs/design.md`, do not re-derive them: 25 MB file cap
(`413`), 1–10 items per request, magic link 14-day default / 90-day max, 5-minute signed download
URLs, 256-bit token stored as SHA-256 only, session 7 days absolute, account tokens 60 min and
single-use, cursor pagination `limit` 20 / max 100, and the rate-limit table. Error envelope is
`{ "error": { "code", "message", "details" } }` everywhere; another owner's resource is `404`, never
`403`; unknown/expired/revoked link is always the same `410`.

## Environment files

Three, all gitignored; only the `.env.example` files are tracked.

- `.env` — shared values plus every `*_BIND`/`*_PORT` variable Compose reads.
- `api/.env` — Laravel: `APP_KEY`, `DB_*` (`DB_HOST=db`, the compose service name), session/cache/queue
  on `database` driver, `FILESYSTEM_DISK=local`.
- `web/.env` — one line: `VITE_API_URL="${API_URL}"`, expanded from the root `.env`.

`api/.env.example` ships a fixed development `APP_KEY` so a fresh clone works. Do not regenerate it;
encrypted data would break. `npm run setup` uses `cp -n`, so it will not clobber an existing `.env`.

## Existing instruction files

`api/AGENTS.md` and `api/CLAUDE.md` are byte-identical, auto-generated by Laravel Boost
(`composer boost:update` rewrites them). Read them for Laravel/Pest/Pint conventions, but do not
hand-edit them — put repo-specific rules here or in `docs/`. The Boost MCP server is configured in
`api/opencode.json` (skills live in `api/.agents/skills/`). The `.ai/rules` directory the Boost
guidelines reference does not exist in this repo, so that instruction is inert.

## CI

`.github/workflows/tests.yml`, one job `Lint and test`, on PRs to `main` and pushes to `main`, plus
`workflow_dispatch`. Order matters and is enforced: **build → migrate → lint → test**. It starts from
fresh `.env.example` copies, so anything that only works with a hand-edited `.env` will fail CI.
Trunk-based: small changes merged to `main` after CI is green.