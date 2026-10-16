# Sendocs

Sendocs is a document-collection app for professionals who need files from a client without asking them to create another account. An owner creates a request, shares one link, and tracks the files as they arrive.

It is designed for work like client onboarding, where the process often ends up spread across email threads and attachments.

## What it does

- Create a request with a named list of required documents.
- Share a client portal link that works without a client account.
- Track which items have arrived and which are still waiting.
- Download uploaded files from the owner dashboard.
- Revoke a client link or delete a document when it is no longer needed.
- Sign in with email/password or Google OAuth.

## How it fits together

The owner uses the dashboard to create a request. Sendocs returns the client link once; the client opens it, uploads the requested files, and can return to the same link until it expires or is revoked. The owner sees progress in the dashboard.

![Diagram](/docs/diagram/quick-flow.png)

The web app and API are separate parts of the same repository. PostgreSQL stores application records; file contents are handled separately by the storage layer.

## Stack

| Area           | Technology                                            |
| -------------- | ----------------------------------------------------- |
| API            | Laravel 13, PHP 8.4                                   |
| Web            | React, TypeScript, Vite                               |
| Database       | PostgreSQL                                            |
| Local services | Docker Compose, RustFS (S3-compatible object storage) |
| Automation     | GitHub Actions                                        |

## Engineering decisions worth looking at

- **A client does not need an account.** The request link is the credential for the portal.
- **Only a hash of the magic-link token is stored.** The raw link is returned when the request is created and is not exposed by later API responses.
- **Dead links do not disclose why they failed.** Unknown, expired, and revoked links use the same response.
- **Files are not meant to be public.** Downloads are authorized by the API and use short-lived signed URLs where supported by the configured storage.
- **Progress is derived from uploaded documents.** It is not stored as a counter, so deleting a document can correctly return an item to the waiting state.
- **Database constraints back up application rules.** A request item can have only one document, and request creation keeps its items together in a transaction.
- **Owner access is scoped to the signed-in owner.** A user should not be able to discover another owner's request by changing an identifier.

The feature documents describe the behavior and trade-offs in more detail.

## Repository guide

- [Technical design](docs/design.md) — architecture, data model, and operational considerations.
- [Technical decisions](docs/decisions.md) — why the main stack and security choices were made.
- [Repository structure](docs/structure.md) — directories, containers, environment variables, and commands.
- [Deployment & releases](docs/deployment.md) — staging, tagged production releases, and current deployment limitations.
- [Frontend conventions](docs/frontend.md) — shared rendering and data-handling rules.
- [OpenAPI contract](docs/openapi.yaml) — versioned API endpoints, payloads, and errors.

Feature behavior has its own source-of-truth document:

- [Authentication and access](docs/features/auth-and-access.md)
- [Document requests](docs/features/document-requests.md)
- [Secure magic links](docs/features/secure-magic-link.md)
- [Progress tracking](docs/features/progress-tracking.md)
- [Owner dashboard](docs/features/owner-dashboard.md)
- [Client portal](docs/features/client-portal.md)

## Run locally

From the repository root, run:

```bash
npm run setup
npm run dev
```

The setup command creates local environment files from the examples if they do not already exist, builds the service images, and runs the database migrations. The development command starts the services. Open [http://localhost:3000](http://localhost:3000) for the web app.

The default local PostgreSQL database is configured in both `.env.example` and `api/.env.example`. Compose also starts RustFS with a persistent volume, creates the private `sendocs-private` bucket, and binds its S3 API and console to localhost. The local S3 credentials are for development only; replace them before exposing any service. The API uses path-style S3 URLs and generates five-minute signed downloads. Production can use another S3-compatible provider by configuring the API's `AWS_*` variables for that provider. If you change the database name, username, or password in the root `.env`, update the matching `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` values in `api/.env` as well.

To run the configured test suites:

```bash
npm run test
```

These commands reflect the checked-in scripts. They have not been executed as part of this README change; if setup fails on a fresh checkout, please open an issue with the failing command and its output.

## Checks and delivery

GitHub Actions defines separate checks for the API and web app in [CI](.github/workflows/ci.yml). The API job runs the Composer test suite; the web job runs its lint/type checks, unit tests, and Playwright tests.

The [production image workflow](.github/workflows/build.yml) builds the API and web Docker production targets. Staging and production deployment workflows are also present; the release process and its operational limits are documented in [docs/deployment.md](docs/deployment.md).

Workflow files describe what is configured to run. Check the latest Actions run for the result on a particular commit.

## Live preview

Try the live Sendocs preview at [sendocs.saeedhosan.com](https://sendocs.saeedhosan.com/).

This is a demo environment. Please avoid uploading sensitive or real client documents.

## Project status

Sendocs is an active portfolio project. The focus is on making the core document-request workflow dependable, documenting the security and data-integrity decisions, and making setup and releases repeatable. The design documents are kept alongside the code so implementation changes can be reviewed against an explicit contract.
