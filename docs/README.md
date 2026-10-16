# Sendocs

A document request service for client onboarding. One secure link lets a client upload documents without an account, and gives the owner one place to track progress and download files.

## Product Information

- **Name**: Sendocs
- **Title**: Client Document Collection
- **Slug**: sendocs
- **Description**: A secure document request service for client onboarding.
- **Short description**: Collect client documents with one secure link.
- **Tags**: SaaS, docs collect, client onboarding,

## Documentation

Design docs live in `docs/`. Each feature has one doc and one owner, so rules are not duplicated.

| Doc                                                          | Owns                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| [`design.md`](docs/design.md)                                | System scope, data layer, architecture, deploy, and release   |
| [`auth-and-access.md`](docs/features/auth-and-access.md)     | Owner sessions, cookies, CSRF, passwords, and isolation       |
| [`document-requests.md`](docs/features/document-requests.md) | Request schema, API, file validation, and storage             |
| [`secure-magic-link.md`](docs/features/secure-magic-link.md) | Token generation, validation, expiry, revocation, and leakage |
| [`progress-tracking.md`](docs/features/progress-tracking.md) | Derived progress and why it is never stored                   |
| [`owner-dashboard.md`](docs/features/owner-dashboard.md)     | Owner screens, states, and interactions                       |
| [`client-portal.md`](docs/features/client-portal.md)         | Client screens, uploads, and untrusted rendering              |
| [`frontend.md`](docs/frontend.md)                            | Shared React rendering, loading, and data handling            |
| [`structure.md`](docs/structure.md)                          | Repository layout, containers, and root commands               |
| [`openapi.yaml`](docs/openapi.yaml)                          | HTTP contract: endpoints, bodies, responses, and limits       |
| [`decisions.md`](docs/decisions.md)                          | Architectural decisions and their reasoning                   |

## Status

The API and web surfaces are scaffolded, and the container stack runs them locally. Features are still to be built against the documents below.

The stack is settled in `docs/decisions.md`: Laravel on PHP 8.4 and React for both surfaces.

## Stack

- **PostgreSQL** — users, sessions, requests, items, and file metadata.
- **Laravel on PHP 8.4** — sessions, CSRF, migrations, and queues.
- **React** — both surfaces render as single-page apps.
- **Queue worker** — account emails. A separate scheduler retries durable object-cleanup tasks.
- **Docker Compose** — app and PostgreSQL locally.

## Requirements

- Docker with Compose.
- Node.js, to run the root commands.

No host PHP, Composer, Bun, or PostgreSQL is needed.

## Commands

The root `package.json` is the command surface for the repository.

| Command         | Purpose                            |
| :-------------- | :--------------------------------- |
| `docker compose up --build` | Build images, run migrations, and start all services |
| `docker compose up`         | Start services (using existing images)              |
| `docker compose build`     | Build all service images                            |
| `docker compose run --rm api composer test` | Run API tests                             |
| `docker compose run --rm web bun run test`  | Run web tests                              |

`docker compose up --build` starts the API, the web UI, the queue worker, the scheduler, PostgreSQL, RustFS, and the migration one-shot. The application is served at `http://localhost:3000`; the API is published separately on `http://localhost:8000` for command-line clients. Only the root `.env` file is used.

Quickstart:

```bash
cp -n .env.example .env
docker compose up --build
```

## Conventions

- One doc per feature; each doc owns its rules.
- Shared numbers have one owner.
- Undecided items stay in Open Questions.
- Stack choices go in `docs/decisions.md`.
- API changes update the owning doc and `openapi.yaml`.
- Decisions link to feature docs and do not duplicate their rules.

## Open Decisions

All entries in `docs/decisions.md` are accepted, so nothing blocks implementation.

Product questions, such as lost-link recovery and file replacement, stay in the owning feature doc.
