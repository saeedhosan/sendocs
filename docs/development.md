# Development

How to run and test Sendocs locally. For production, see [production.md](production.md).

## Prerequisites

- **Docker** with the Compose plugin (recommended). No host language toolchain is needed.
- **Without Docker:** PHP 8.3+ and Composer (API), Bun or Node 20+ (web), and PostgreSQL 14+.

## Quick Start (Docker)

```bash
git clone https://github.com/saeedhosan/sendocs.git
cd sendocs

cp -n .env.example .env          # Configure .env for all services
docker compose build             # Build all images
docker compose run --rm migrate  # Run database migrations
docker compose up -d             # Start all services
```

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8000](http://localhost:8000)

`docker compose up -d` starts the web UI, API, queue worker, scheduler, PostgreSQL, and RustFS object storage. `docker compose down` stops and removes the containers.

The root `.env` is the only environment file. It ships a fixed development `APP_KEY`, so a fresh clone needs no key generation.

## Running a Single Service

Dependencies start automatically:

```bash
docker compose up -d web    # web + api + database + object storage
docker compose up -d api    # api + database + object storage
```

## Tests

```bash
docker compose run --rm test              # Both suites
docker compose run --rm api composer test # API tests
docker compose run --rm web bun run test  # Web tests
```

Individual steps:

| Surface | Command                   | Runs                        |
| :------ | :------------------------ | :-------------------------- |
| API     | `composer test:lint`      | Pint and Rector             |
| API     | `composer test:types`     | PHPStan                     |
| API     | `composer test:coverage`  | Pest type coverage          |
| API     | `composer test:unit`      | Pest unit and feature tests |
| Web     | `bun run test:lint`       | TypeScript and ESLint       |
| Web     | `bun run test:unit`       | Vitest                      |
| Web     | `bun run test:e2e`        | Playwright                  |

The web e2e suite starts its own Vite server, so it does not need the Compose stack. Playwright browsers ship in the web image; outside Docker, install them once with `bunx playwright install --with-deps chromium`.

## Running Without Docker

Requires a local PostgreSQL. Run the API and web in separate shells.

```bash
cd api
composer install
cp -n .env.example .env     # set DB_HOST=127.0.0.1
php artisan key:generate
php artisan migrate
php artisan serve           # http://localhost:8000
```

```bash
cd web
bun install
bun run dev                 # http://localhost:3000
```

The Vite dev server proxies `/api` and `/health` to `http://127.0.0.1:8000`, so the browser stays same-origin.

## Ports

| Service    | Port       |
| :--------- | :--------- |
| Web        | 3000       |
| API        | 8000       |
| PostgreSQL | 5432       |
| RustFS     | 9000, 9001 |

Every published port binds to `127.0.0.1` unless `.env` says otherwise.
