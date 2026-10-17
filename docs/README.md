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
| [`structure.md`](docs/structure.md)                          | Repository layout, containers, and root commands              |
| [`openapi.yaml`](docs/openapi.yaml)                          | HTTP contract: endpoints, bodies, responses, and limits       |
| [`decisions.md`](docs/decisions.md)                          | Architectural decisions and their reasoning                   |

## Conventions

- One doc per feature; each doc owns its rules.
- Shared numbers have one owner.
- Undecided items stay in Open Questions.
- Stack choices go in `docs/decisions.md`.
- API changes update the owning doc and `openapi.yaml`.
- Decisions link to feature docs and do not duplicate their rules.
