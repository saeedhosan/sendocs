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

- **Run with Docker** - Docker Compose (recommended, no host toolchain)
- **Without docker** - Directly with PHP, Composer, Bun, and PostgreSQL.

### Quick Start (Docker)

```bash
git clone https://github.com/saeedhosan/sendocs.git
cd sendocs

docker compose run api composer setup    # Setup and configure .env or api/.env
docker compose up -d --build             # Build images and start everything
```

Open [http://localhost:3000](http://localhost:3000).

Stop with `docker compose down`.

To run one service instead of everything (dependencies start automatically):

```bash
docker compose up -d web    # web + api + database + object storage
docker compose up -d api    # api + database + object storage
```

### Tests

```bash
docker compose run --rm test              # Both suites
docker compose run --rm api composer test # API tests only
docker compose run --rm web bun run test  # Web tests only
```

- **API Tests**: Composer and Pest/PHPUnit suites.
- **Web Checks**: Static analysis, TypeScript, unit tests, and Playwright e2e.
- **Container**: Builds production-ready API and web images.

### Running Without Docker

Start PostgreSQL locally, then:

```bash
cd api && composer setup  # Setup api and configure api/.env
cd ../web && bun install  # Setup web and configure web/.env

bun run dev               # Run react web development
bun run build             # Build react web assets


cd ../api                 # Navigate to api project
composer run dev          # Run api development server
```

### Production Deployment

```bash

git clone https://github.com/saeedhosan/sendocs.git
cd sendocs

docker compose run setup    # Setup and configure .env
docker compose run migrate  # Run database migration
docker ...                  # Start production servcies
```
