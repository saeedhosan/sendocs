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

## Documentation Guide

## Tech Stack

| Layer              | Technologies                                    |
| ------------------ | ----------------------------------------------- |
| **API / Backend**  | Laravel 13, PHP 8.4, RESTful Architecture       |
| **Web / Frontend** | React, TypeScript, Vite, Shadcn UI              |
| **Database**       | PostgreSQL                                      |
| **Services**       | Docker Compose, S3-compatible object storage    |
| **Automation**     | GitHub Actions (testing, linting, image builds) |

## Development

- **With Docker** - Docker Compose (recommended, no host toolchain).
- **Without Docker** - PHP, Composer, Bun, PostgreSQL.

### Quick Start (Docker)

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

Single service (dependencies start automatically):

```bash
docker compose up -d web    # Start web with its dependencies
docker compose up -d api    # Start API with its dependencies
```

Stop: `docker compose down`

### Tests

```bash
docker compose run --rm test              # Run both test suites
docker compose run --rm api composer test # Run API tests
docker compose run --rm web bun run test  # Run web tests
```

### Running Without Docker

Requires a local PostgreSQL. Run the API and web in separate shells.

```bash
cd api
composer install            # Install PHP dependencies
cp -n .env.example .env     # Configure .env (set DB_HOST=127.0.0.1)
php artisan key:generate    # Generate the application key
php artisan migrate         # Run database migrations
php artisan serve           # Start the API server
```

API runs at [http://localhost:8000](http://localhost:8000).

```bash
cd web
bun install                 # Install JavaScript dependencies
bun run dev                 # Start the dev server
```

Web runs at [http://localhost:3000](http://localhost:3000); the dev server proxies /api to API server.

### Production Deployment

Set `API_TARGET=prod` and `WEB_TARGET=prod` in `.env`, then:

```bash
cp -n .env.example .env          # Configure .env (set API_TARGET=prod and WEB_TARGET=prod)
docker compose build             # Build production images
docker compose run --rm migrate  # Run database migrations
docker compose up -d             # Start production services
```

Served at [http://localhost:3000](http://localhost:3000). For public access, set `WEB_BIND=0.0.0.0` in `.env`.

Pushing to `stage` deploys staging; pushing a `v*` tag on `main` deploys production. See [docs/deployment.md](docs/deployment.md).
