# Development

How Sendocs is structured and run locally. For production, see [production.md](production.md).

Sendocs uses a monorepo containing the API, web UI, and future mobile and desktop clients. Each deployable surface lives in its own top-level directory with independent dependencies and build configuration.

## Table of Contents

- [Project structures](#project-structures)
- [Directory ownership](#directory-ownership)
- [Toolchain](#toolchain)
- [Containers](#containers)
- [Environments](#environments)
- [Workflow files](#workflow-files)
- [Root commands](#root-commands)
- [Quick start (docker)](#quick-start-docker)
- [Running a single service](#running-a-single-service)
- [Tests and quality](#tests-and-quality)
- [Running without Docker](#running-without-docker)
- [Ports](#ports)

## Project structures

```text
sendocs/
├── .github/          Automation
│   ├── workflows/    Dispatch and reusable per-surface workflows
│   ├── actions/      Shared composite steps
│   ├── dependabot.yml
│   └── CODEOWNERS
├── api/              Laravel API application
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   ├── docker/       Container entrypoint and PHP configuration
│   ├── Dockerfile    Development and production images
│   ├── composer.json
│   └── composer.lock
├── web/              React web application
│   ├── src/
│   ├── tests/
│   ├── docker/       Static server and API gateway configuration
│   ├── Dockerfile    Development and production images
│   ├── package.json
│   └── bun.lock
├── mobile/           Mobile client, when scheduled
├── desktop/          Desktop client, when scheduled
├── docs/             Design documents and OpenAPI contract
├── compose.yaml      Service composition for every environment
├── package.json      Root command surface
└── .env.example      Documented environment variables
```

## Directory Ownership

| Directory  | Responsibility                                 |
| :--------- | :--------------------------------------------- |
| `.github/` | Continuous integration, delivery               |
| `api/`     | REST API, business rules, and backend services |
| `web/`     | Owner dashboard and client portal UI           |
| `mobile/`  | Future mobile client                           |
| `desktop/` | Future desktop client                          |
| `docs/`    | Product, technical, documentation              |

- Each deployable owns its dependencies, configuration, tests, build, and Dockerfile.
- The root `compose.yaml` owns only how the services are composed and run together.

## Toolchain

| Directory | Manifest        | Lockfile        | Dependencies        | Runtime |
| :-------- | :-------------- | :-------------- | :------------------ | :------ |
| `api/`    | `composer.json` | `composer.lock` | `api/vendor/`       | PHP 8.4 |
| `web/`    | `package.json`  | `bun.lock`      | `web/node_modules/` | Bun     |
| root      | `package.json`  | none            | none                | Node.js |

## Containers

| Service     | Purpose                                                        |
| :---------- | :------------------------------------------------------------- |
| `api`       | Laravel API, as a development server or as PHP-FPM             |
| `worker`    | Laravel queue worker for account email                         |
| `scheduler` | Laravel scheduler; retries durable object cleanup every minute |
| `web`       | Vite development server, or the built assets behind nginx      |
| `db`        | PostgreSQL database                                            |

## Environments

- Each application surface has its own environment configuration.
- The root `.env` holds the variables Compose passes to every container.
- Secrets must never appear in client bundles, build artifacts, or runtime payloads.

## Workflow Files

| Workflow file                  | Purpose                        |
| :----------------------------- | :----------------------------- |
| `.github/workflows/ci.yml`     | Run API and web checks         |
| `.github/workflows/build.yml`  | Container tests and production image build |
| `.github/workflows/stage.yml`  | Stage deployment               |
| `.github/workflows/deploy.yml` | Test and production deploy     |

## Root Commands

| Command                                     | Purpose                                |
| :------------------------------------------ | :------------------------------------- |
| `docker compose up --build`                 | Build images, and start all services   |
| `docker compose up`                         | Start services (using existing images) |
| `docker compose build`                      | Build all images                       |
| `docker compose run --rm api composer test` | Run API tests                          |
| `docker compose run --rm web bun run test`  | Run web tests                          |
| `docker compose run --rm api composer lint` | Run API linters                        |
| `docker compose run --rm web bun run lint`  | Run web linter                         |

## Quick Start (docker)

Requires [Docker](https://docs.docker.com/get-docker/) with the Compose plugin.

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

Stop: `docker compose down`

## Running a Single Service

Dependencies start automatically:

```bash
docker compose up -d web    # web + api + database + object storage
docker compose up -d api    # api + database + object storage
```

## Tests and quality

```bash
docker compose run --rm test              # Both suites
docker compose run --rm api composer test # API tests
docker compose run --rm web bun run test  # Web tests
```

Individual steps:

| Surface | Command                  | Runs                        |
| :------ | :----------------------- | :-------------------------- |
| API     | `composer test:lint`     | Pint and Rector             |
| API     | `composer test:types`    | PHPStan                     |
| API     | `composer test:coverage` | Pest type coverage          |
| API     | `composer test:unit`     | Pest unit and feature tests |
| Web     | `bun run test:lint`      | TypeScript and ESLint       |
| Web     | `bun run test:unit`      | Vitest                      |
| Web     | `bun run test:e2e`       | Playwright                  |

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
