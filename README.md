# Sendocs

Sendocs lets a professional collect documents from a client with one secure link. Clients upload without an account; owners track progress and download files. Built for accountants, consultants, freelancers, and lawyers.

Collecting documents over email means repeated chasing, unlabeled attachments, and files scattered across inboxes. Full CRM and onboarding suites are heavy when you only need a few files from one person.

This system does one job, one request, one link, one place for the files, with expiry, revocation, private storage, and validation handled correctly.

## What It Does

- **Auth and Access:** authentication and access control for owner accounts.
- **Owner Dashboard:** list requests, view progress, revoke links, download files.
- **Document Requests:** owners create requests with 1–10 required documents.
- **Secure Magic Link:** secure, expiring, revocable client access.
- **Progress Tracking:** derived from uploaded documents, never stored.
- **Client Portal:** clients view required items and upload files without an account.
- **Private Files:** validated uploads stored under random private keys.

## How it works

1. The owner creates a request with a list of required documents.
2. The API returns a magic link once. Only its hash is stored.
3. The client opens the link and uploads one file per item.
4. The API validates each file, stores it privately, and saves metadata in the database.
5. The owner sees progress and downloads files through short-lived signed URLs.

## Live Preview

Try the live Sendocs preview at [sendocs.saeedhosan.com](https://sendocs.saeedhosan.com/).

_This is a demo environment. Please avoid uploading sensitive or real client documents._

## Architecture

The React (web) app and API are separate parts of the same repository. PostgreSQL stores application records; file contents are handled separately by the private object storage.

![Diagram](/docs/diagram/quick-flow.png)

## Engineering Highlights

- **Constraint-first database:** PostgreSQL enforces the invariants (one token hash, one item per position, cascading deletes); a request commits with its items and token in one transaction.
- **Hash-only magic links:** a 256-bit token stored as its SHA-256 hash, so a database leak yields no working links; expiry and revocation end a link with no background job.
- **Private-by-default files:** validated uploads stored under random keys; access is a 5-minute signed link, never a public path.
- **Transactional outbox:** the database and object store can't share a transaction, so object deletions are queued in PostgreSQL and retried with exponential backoff, avoiding blocked deletes and orphaned files.
- **Dev/prod parity:** one Compose file and multi-stage images run the same code everywhere; Vite and nginx proxy the API so sessions and CSRF match.
- **Automated quality gates:** CI runs Pest, PHPStan, Pint, Rector, Vitest, Playwright, ESLint, and tsc, then builds images and ships production on a version tag.

## Documentation Guide

- [Design](docs/design.md) — system scope, data, architecture, deployment.
- [Decisions](docs/decisions.md) — architectural choices and their reasoning.
- [Frontend](docs/frontend.md) — shared React rendering and data handling.
- [Feature specs](docs/features/) — auth, document requests, magic links, progress, dashboards, portal.
- [OpenAPI contract](docs/openapi.yaml) — versioned API endpoints, payloads, and errors.

## Tech Stack

| Layer              | Technologies                                    |
| ------------------ | ----------------------------------------------- |
| **API / Backend**  | Laravel 13, PHP 8.4, RESTful Architecture       |
| **Web / Frontend** | React, TypeScript, Vite, Shadcn UI              |
| **Database**       | PostgreSQL                                      |
| **Services**       | Docker Compose, S3-compatible object storage    |
| **Automation**     | GitHub Actions (testing, linting, image builds) |

## Quick Start

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

Full guides:

- [Development](docs/development.md) (single service, without Docker, per-surface commands)
- [Production](docs/production.md) (production images and deployment)

### Testing

```bash
docker compose run --rm test              # Run both test suites

# or
docker compose run --rm api composer test # Run API tests
docker compose run --rm web bun run test  # Run web tests
```
