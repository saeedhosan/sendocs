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

### Prerequisites

You will need **Docker** with the Compose plugin, to run API and web servers with PostgreSQL containers

### Quick Start

Clone the repository and navigate to project directory:

```bash
git clone https://github.com/saeedhosan/sendocs.git
cd sendocs
```

```bash
cp -n .env.example .env   ## Copy and filled env
docker compose -- setup   ## Setup full application
docker compose -- dev     ## Run dev server for all services
docker compose -- test    ## Run full test suites
docker dompose -- build   ## Build all services for production
```

### Quality Assurance

Automated workflows via GitHub Actions ensure high code quality:

- **API Tests**: Executes backend test suites via Composer and Pest/PHPUnit.
- **Web Checks**: Runs frontend static analysis, TypeScript type-checking, unit tests, and Playwright end-to-end tests.
- **Container**: Automatically builds production-ready Docker images for the API and web services.
