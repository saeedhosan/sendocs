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

## TD-003 - Secure Magic Links

**Status:** Accepted
**Date:** 2026-09-30

### Context

Recipients upload documents without an account.

The link is their only credential. It must be hard to guess, easy to revoke, and short-lived.

### Decision

Create a `256-bit secure random` token and put it in the path: /portal/{token}

Store only its SHA-256 hash.

The token:

- Uses 256 bits of randomness, as URL-safe Base64.
- Expires after 14 days by default, and never past 90 days.
- Is reusable until it expires, and the owner can revoke it at any time.
- Is never stored as plain text.
- Sets no cookie and creates no recipient session.

A portal link is deliberately multi-use: a recipient leaves halfway and comes back, so
single-use would break the workflow. Expiry and revocation are the controls instead of
consumption. Account tokens are the opposite case, and they stay single-use.

Logs show redacted. The portal sends Referrer-Policy: no-referrer.

### Alternatives Considered

- **Signed JWT/HMAC:** needs a signing key, and there are no claims to carry.
- **bcrypt/Argon2:** slow hashing is for short passwords. token has nothing to guess.
- **Cookie session:** the link already works as a credential.
- **Query strings:** they leak into logs and shared links more easily than paths do.
- **Rotate on every use:** rotating would break a recipient who leaves and returns.

### Rationale

- The token is too random to guess, so a fast hash is enough.
- Storing the hash means a stolen database holds no working links.
- No recipient state means no account, session, or cookie.
- Expiry and revocation end a link on purpose, with no background job.

### Consequences

**Positive**

- A stolen database gives no working links.
- Checking a link is one fast lookup.
- The portal stores no recipient state.
- A link dies at expiry or at revocation, not at first use.

**Negative**

- A lost link cannot be recovered. The owner creates a new request.
- A slow recipient needs a new link after 14 days.
- The token stays in browser history, so redaction is required.

## TD-004 - Backend Framework

**Status:** Accepted
**Date:** 2026-09-30

### Context

Needed: server sessions, CSRF protection, migrations, object storage, a queue for account email, REST APIs, and sign-in flows.

The load is small, so clarity and upkeep matter more than speed.

### Decision

Use `Laravel 13` with PHP 8.4.

It already provides sessions, CSRF protection, migrations, queues, and S3 object storage.

### Alternatives Considered

- **Node.js:** 1 language across the stack, but would apply sessions and auth ourselves.
- **Go:** a small binary to deploy, but more framework choices than this load needs.
- **Custom framework:** less to learn, but we would build the security parts by hand.

### Rationale

- Laravel covers every need listed above.
- The load does not need a faster framework.

### Consequences

**Positive**

- The main backend pieces are already built.
- Sign-in and database work go faster.
- Migrations, queues, and storage have working integrations.
- Every part of the app looks the same.

**Negative**

- PHP and Laravel become part of what we run and maintain.
- Its conventions shape how we write the code.

## TD-005 - Frontend Framework

**Status:** Accepted
**Date:** 2026-09-30

### Context

We need to render views for owner, clients and other general pages
All UI pages run the api origin to get server data with CSRF or auth token.

### Decision

We will use `React 19` to render all views as single-page apps. There is no SSR.

- Navigation stays in the browser, with no full page reload.
- CI builds the apps. The server serves the assets, and never renders views.
- Views fetch after boot, and the CSRF token comes from the API and stays in memory.

### Alternatives Considered

- **Next.js:** server rendering we do not need, plus a server runtime and routing weight.
- **Vue.js:** a smaller runtime, but React has wider library coverage.
- **SvelteJS:** the smallest runtime, but a smaller ecosystem means hand-written work.
- **No-framework:** upload state and status messages get harder to manage by hand.

### Rationale

One model covers the app, so a screen is built the same way everywhere.
React handles uploads and state that changes on its own, which is what the app needs.
It is widely known, so examples and help are easy to find.

### Consequences

**Positive**

- One component model covers the app, so shared UI does not drift.
- A screen is built, tested, and changed in one place.
- Upload and progress state come from the framework.
- Links and history work without a reload.

**Negative**

- Nothing renders before the first fetch, so the first paint is a loading state.
- JavaScript is required, so a broken bundle means a blank screen.
- The build output must be hosted, cached, and versioned.
- The app needs an API call for the CSRF token, so it is not a plain static file.

## TD-006 - Production Deployment

**Status:** Accepted
**Date:** 2026-09-30

### Context

Load is about 0.1 requests a second, and 1 at peak, with about 75 GB of new files a month.

We do not need many app instances or an orchestrator to start.

### Decision

Run the application as a container:

- One app container
- Managed PostgreSQL
- Private S3-compatible storage
- Docker Compose for local work
- HTTPS, daily backups, and health checks in production

The app serves the API and the built assets from one origin.

Migrations run before the new version takes traffic.

### Alternatives Considered

- **Managed app platform:** one less thing to run, but it hides the migration step and long uploads.
- **Kubernetes:** far more to operate than this load needs.
- **Hand-run virtual machine:** local and production drift apart over time.
- **Many app instances now:** nothing measured needs more than one.

### Rationale

- One instance handles the load with room to spare.
- Containers give the same setup on a laptop and in production.
- Managed services mean we do not run stateful systems ourselves.
- More instances can come later if traffic or uptime needs them.

### Consequences

**Positive**

- The same image runs everywhere.
- Local setup is one command with Docker Compose.
- There are few moving parts to operate.
- Backups and file durability are handled for us.
- Adding instances later is straightforward.

**Negative**

- One instance is a single point of failure.
- Each deploy replaces the running one, so downtime is brief but real.
- There is no CDN and no second region at the start.

## TD-007 - Cookie-Based API Access

**Status:** Accepted
**Date:** 2026-10-05

### Context

The owner app and API use the same origin.

The API needs authenticated access to owner resources.

We do not need third-party API access yet.

### Decision

Use **session cookies** for owner API access.

- Store only the session token hash.
- Send the session in an HttpOnly cookie.
- Require CSRF protection for state-changing requests.
- Scope resources by `owner_id`.
- Do not use API tokens for now.

### Alternatives Considered

- **API tokens:** - Useful for external clients, but not needed now.
- **JWT:** - Adds complexity without a clear benefit.
- **Cookies without CSRF:** - Not safe for browser requests.

### Rationale

The owner API is used by a browser-based React app.

Cookies fit the same-origin setup and keep session credentials out of JavaScript.

Sessions also make expiry and revocation simple.

### Consequences

**Positive**

- Simple browser authentication.
- HttpOnly session cookie.
- Easy logout and revocation.
- No API token management.

**Negative**

- State-changing requests need CSRF protection.
- CLI clients cannot use the browser session directly.
- API testing needs a session cookie.

## TD-008 - Durable Object Cleanup

**Status:** Accepted  
**Date:** 2026-10-09

### Context

PostgreSQL metadata and S3 objects cannot participate in one atomic transaction. Deleting objects first can leave database references to missing files if the transaction rolls back; deleting objects after commit can leave orphaned objects when storage is unavailable.

### Decision

Use a PostgreSQL-backed cleanup outbox. In the same database transaction that deletes document metadata, insert each affected storage key into `storage_deletion_outbox`. A scheduled command attempts pending deletions in bounded batches and removes an outbox row only after S3 confirms deletion. Failed attempts remain stored, increment an attempt counter, and are retried with exponential backoff capped at one hour.

The API does not wait for object deletion. Account deletion, request deletion, document deletion, and failed-upload cleanup use the same outbox. The queue worker remains dedicated to account email; a separate scheduler runs the cleanup command every minute.

### Consequences

**Positive**

- Metadata deletion and cleanup intent commit or roll back together.
- Storage outages do not block deletion responses.
- Failed cleanup survives process restarts and is retried automatically.
- Repeating deletion is safe for the same object key.

**Negative**

- Objects may remain in private storage briefly after metadata is deleted.
- The scheduler and outbox table must be monitored.
- Persistent failures require operational follow-up; retries do not make a permanently unavailable bucket recover.
