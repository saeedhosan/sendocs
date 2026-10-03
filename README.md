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
| [`openapi.yaml`](docs/openapi.yaml)                          | HTTP contract: endpoints, bodies, responses, and limits       |
| [`decisions.md`](docs/decisions.md)                          | Architectural decisions and their reasoning                   |

## Status

This repository currently contains documentation only. There is no application code yet, so the setup below is the intended workflow.

The stack is settled in `docs/decisions.md`: Laravel on PHP 8.3 and React for both surfaces.

## Stack

- **PostgreSQL** — users, sessions, requests, items, and file metadata.
- **Private S3 storage** — MinIO locally; private bucket with signed URLs in production.
- **Laravel on PHP 8.3** — sessions, CSRF, migrations, and queues.
- **React** — both surfaces render as single-page apps.
- **Queue worker** — account emails only; never used by requests or uploads.
- **Docker Compose** — app, PostgreSQL, and MinIO locally.

## Requirements

- Docker with Compose.
- PHP 8.3+ and Composer for host-based runs.

## Local Development

```bash
cp .env.example .env
docker compose up -d
composer install
php artisan migrate
php artisan queue:work
php artisan serve
```

The compose file, Dockerfile, and `.env.example` arrive with the application code, so these commands are not runnable today.

The MinIO bucket must be private. No environment exposes a public object path.

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
