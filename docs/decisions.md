# Technical Decisions

This document records the architectural decisions that define how the application is built and operated, and the reasoning behind each one: the context, the decision, the alternatives considered, and the consequences.

Feature-specific implementation details belong in their respective feature documents.

## Quick Links

- [TD-001 - Database](#td-001---database)
- [TD-002 - Object File Storage](#td-002---object-file-storage)
- [TD-003 - Secure Magic Links](#td-003---secure-magic-links)
- [TD-004 - Backend Framework](#td-004---backend-framework)
- [TD-005 - Frontend Framework](#td-005---frontend-framework)
- [TD-006 - Production Deployment](#td-006---production-deployment)
- [TD-007 - Cookie-baed API access](#td-007---cookie-based-api-access)

## TD-001 - Database

**Status:** Accepted
**Date:** 2026-09-30

### Context

The system stores users, sessions, requests, items, document metadata, and rate-limit counters.

Rules must always hold: one token per hash, one item per position, every document tied to an item, and a request created with its items or not at all.

Load is about 200 requests and 500 uploads a day: 0.1 requests a second on average, and 1 at peak.

### Decision

Use `PostgreSQL` as the only store for app data. Let the database enforce the rules:

- Unique email and token hash
- Unique (request_id, position)
- Foreign keys cascade on delete

Create a request, its items, and its token hash in one transaction.

### Alternatives Considered

- **MySQL:** - Does the same job, with no clear gain here.
- **SQLite:** - Simple locally, but cannot run two app instances or a migration at once.
- **NoSQL:** - Our rules are links between records, which it would be hard to enforce.
- **Redis:** - Temporary data only. Neither survives a restart.

### Rationale

Most rules are about how records link. A relational database enforces them on its own, so the code does not have to.

One managed instance is enough for this load.

### Consequences

**Positive**

- Rules hold even when the code is wrong and applied RDMS correctly.
- A request and its items are always created together.
- Deleting a request clears its items in one step.
- Indexes keep lookups fast.

**Negative**

- Every signed-in request reads the database.
- Uploads hold a connection, so the pool must be sized for them.

## TD-002 - Object File Storage

**Status:** Accepted
**Date:** 2026-09-30

### Context

- Files are stored apart from the application's data.
- A file can be up to 25 MB. Expect about 75 GB a month.
- Files stay private. Only an authorized request may read one.

### Decision

Use `private S3-compatible storage`. RustFS is the local Compose implementation; production may use another S3-compatible provider after its required operations pass integration tests.

- No file has a public path.
- Each file sits under a random key.
- The API checks access, then returns a download link.
- That link expires after 5 minutes.
- Uploads pass through the app, which checks the file first.

### Alternatives Considered

- **Public storage** - Rejected; a hidden key is not access control.
- **Database blobs** - 75 GB a month would grow the database and every backup.
- **Local filesystem** - One machine would hold every file become singe point of failure.

### Rationale

Data and files have different needs. The database handles links and rules. Object storage handles large files.

The app decides who may read a file. Storage only holds the bytes.

A link that expires in minutes limits the damage if it leaks.

### Consequences

**Positive**

- Files do not depend on one app server.
- Downloads use no app memory or bandwidth.
- Files survive a deploy or a restart.
- The code works with any S3-compatible provider.

**Negative**

- The database and the bucket cannot share one transaction.
- A failure can leave a file with no row, which needs cleaning up.
- The storage key is as sensitive as the database key.

### TD-009 - Laravel HTTP Runtime

**Status:** Accepted  
**Date:** 2026-11-21

### Context

The API needs a consistent HTTP runtime in development, production, and load tests. PHP-FPM adds a separate FastCGI process model and configuration that is not needed when the API is served by a persistent application server.

### Decision

Run the Laravel HTTP API through **Laravel Octane on FrankenPHP** in both development and production.

- Nginx serves the production React bundle and reverse-proxies API and health requests to FrankenPHP over HTTP.
- Nginx logs requests taking at least five seconds to container stderr with request and upstream timings; sensitive magic-link paths remain redacted.
- The development Compose API service runs the same Octane/FrankenPHP server.
- Queue workers, the scheduler, and migrations remain separate PHP CLI processes.
- Octane workers are recycled after a bounded request count; development uses one worker recycled after every request.
- PHP-FPM and FastCGI are not part of the runtime.

### Alternatives Considered

- **PHP-FPM:** A proven production runtime, but it requires a separate FastCGI process and configuration. It would also leave development and production using different HTTP runtimes if Octane were used only in production.
- **PHP CLI built-in server:** Simple for local development, but not intended as a production application server and would create a different runtime from production.
- **RoadRunner:** Supports persistent Laravel workers through Octane, but adds a separate server binary and its own process configuration.
- **Swoole:** Supports persistent workers through Octane, but requires the Swoole extension and its runtime-specific compatibility considerations.

### Rationale

- One HTTP runtime is used across development, production, and performance tests.
- Octane keeps the Laravel application bootstrapped between requests.
- FrankenPHP provides the HTTP server without a separate PHP-FPM process.
- Nginx remains responsible for serving static frontend assets and same-origin reverse proxying.

### Consequences

**Positive**

- Fewer runtime components and no FastCGI configuration.
- Development and production exercise the same HTTP server.
- Persistent workers reduce repeated application bootstrapping.

**Negative**

- Long-lived workers require attention to request-scoped state and worker recycling.
- Worker count must be tuned against CPU and memory measurements rather than increased blindly.
- FrankenPHP and Octane become required parts of the API image.
