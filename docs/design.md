# Sendocs - Technical Design

Sendocs lets a professional collect documents from a client with one secure link. Clients upload without an account; owners track progress and download files. Built for accountants, consultants, freelancers, and lawyers.

## Why this exists

Collecting documents over email means repeated chasing, unlabeled attachments, and files scattered across inboxes. Full CRM and onboarding suites are heavy when you only need a few files from one person.
This system does one job, one request, one link, one place for the files, with expiry, revocation, private storage, and validation handled correctly.

## How it works

1. The owner creates a request with a list of required documents.
2. The API returns a magic link once. Only its hash is stored.
3. The client opens the link and uploads one file per item.
4. The API validates each file, stores it privately, and saves metadata in the database.
5. The owner sees progress and downloads files through short-lived signed URLs.

## Core Features

- **Auth and Access:** authentication and access control for owner accounts.
- **Document Requests:** owners create requests with 1–10 required documents.
- **Secure Magic Link:** secure, expiring, revocable client access.
- **Progress Tracking:** derived from uploaded documents, never stored.
- **Owner Dashboard:** list requests, view progress, revoke links, download files.
- **Client Portal:** clients view required items and upload files without an account.
- **Private Files:** validated uploads stored under random private keys.

## Table of Contents

- [Core Features](#core-features)
- [Requirements](#requirements)
- [UX and UI](#ux-and-ui)
- [Assumptions](#assumptions)
- [Data Layer](#data-layer)
- [API Design](#api-design)
- [Architecture](#architecture)
- [Trade-offs](#trade-offs)
- [Bottlenecks](#bottlenecks)
- [Development](#development)
- [Performance](#performance)
- [Testing](#testing)
- [Deploy](#deploy)
- [Release](#release)
- [Discussion](#discussion)

## Requirements

### Functional Requirements

- Owner can register and sign in.
- Owner can reset and change password.
- Owner can verify their email address.
- Owner can delete their account and everything it owns.
- Owner can create a request with 1–10 required documents.
- Owner receives the magic link once at creation.
- Owner can view a request and download its documents.
- Owner can delete an uploaded document to be replaced.
- Owner can revoke a link and delete a request.
- Client can open a valid link and view required documents.
- Client can upload one file per required document.

### Non-functional Requirements

- High availability and low latency for the APIs.
- Store only the SHA-256 hash of magic links.
- Keep files private; serve them through short-lived signed URLs.
- Validate files and content on the server, against fixed limits.
- Prevent owners from accessing or detecting another owner's data.
- Return one consistent error format with clear message and response code.
- Handle the assumed workload on one instance; scale out only when measured.
- Back up the database daily; file durability is delegated to object storage.
- Rate-limit counters are shared across instances so limits hold when scaled out.

### Extended Requirements

- Rate-limit public endpoints.
- Cursor pagination on request lists.
- One-command local setup with Docker.

### Out of Requirements

- Teams, workspaces, and multi-tenancy.
- E-signatures and agreements.
- Client accounts and passwords.
- Audit logs, retention policies, and virus scanning.
- Billing, pricing, and waitlists.

## UX and UI

**Pages**

- `/register`, `/login` — owner access.
- `/dashboard` — request list and progress.
- `/requests/new` — create a request.
- `/requests/{id}` — request, documents, and actions.
- `/portal/{token}` — client upload portal.

**User Flow**

```text
Owner                          Client
  |                               |
  | Register / Sign in            |
  v                               |
Dashboard                         |
  |                               |
  v                               |
New Request                       |
  |                               |
  v                               |
Copy Magic Link ----------------->| Opens link
  |                               v
Request Detail                 View Required Documents
  |                               |
  |                               v
  |                            Upload Files
  |                               |
  |                               v
  |                            Complete
  v
Track Progress
```

**Foundation Screens**

- Register and sign in
- Dashboard
- Request detail
- Client portal

**Navigation Screens**

- Dashboard — from the brand and from every detail screen
- New request — from the dashboard header
- Account menu — from the dashboard nav, holding settings and sign out
- Client link — copyable from a request detail

**Discovery Screens**

- Invalid, expired, or revoked link
- Request complete
- Empty request list
- Errors and upload failures
- Unknown success or failures

## Assumptions

### Traffic estimate

- **Daily active users:** `1K/day`
- **API requests:** `~10K/day` (about 0.1 req/s average)
- **Requests created:** `~200/day`
- **File uploads:** `~500/day`
- **Peak traffic:** `~10× average` (about 1 req/s)

### Bandwidth estimate

- **Average file:** `5 MB`
- **Daily uploads:** `~2.5 GB/day`

### Storage estimate

- **Files:** `~75 GB/month`
- **Database:** small next to files
- **Retention:** until the owner deletes the request

### High-level Estimate

| Resource         | Baseline Volume | Monthly Projection | Infrastructure              |
| :--------------- | :-------------- | :----------------- | :-------------------------- |
| **API**          | `~10K/day`      | `~300K/month`      | Single application instance |
| **Requests**     | `~200/day`      | `~6K/month`        | Indexed relational database |
| **Uploads**      | `~500/day`      | `~15K/month`       | Private object storage      |
| **File storage** | `~2.5 GB/day`   | `~75 GB/month`     | Object storage              |
| **Peak traffic** | `~1 req/s`      | `~10× average`     | Scale out only if measured  |

## Data Layer

- **Database:** PostgreSQL.
- **Why:** strong constraints, transactions, and relational modelling.

### Main Tables

We wil define the main core table we need for this system and for details database schema design we will use each docs/features/\*.md

**users**

- `id (UUID)` — owner identifier.
- `name (VARCHAR 120)` — display name.
- `email (VARCHAR 254, unique)` — login email, stored lowercased.
- `password (VARCHAR 255)` — bcrypt hash; never logged or returned.
- `email_verified_at (TIMESTAMPTZ, nullable)` — The verification link is used.
- `created_at (TIMESTAMPTZ)` — creation time.

**sessions**

- `id (UUID)` — session identifier.
- `user_id (UUID)` — session owner.
- `token_hash (CHAR 64, unique)` — SHA-256 hash of the session cookie value.
- `expires_at (TIMESTAMPTZ)` — absolute expiry, 7 days after sign-in.
- `created_at (TIMESTAMPTZ)` — creation time.

**account_tokens**

- `id (UUID)` — token identifier.
- `user_id (UUID)` — token owner.
- `purpose (VARCHAR 20)` — `password_reset` or `email_verification`.
- `token_hash (CHAR 64, unique)` — SHA-256 hash of the emailed token.
- `expires_at (TIMESTAMPTZ)` — absolute expiry, 60 minutes after issue.
- `used_at (TIMESTAMPTZ, nullable)` — set on redemption, so a token is single-use.

**document_requests**

- `id (UUID)` — request identifier.
- `owner_id (UUID)` — request owner.
- `title (VARCHAR 200)` — request title.
- `token_hash (CHAR 64, unique)` — magic-link hash.
- `expires_at (TIMESTAMPTZ)` — link expiry; 14 days by default, 90 days maximum.
- `revoked_at (TIMESTAMPTZ, nullable)` — revocation time.
- `created_at (TIMESTAMPTZ)` — creation time.

**request_items**

- `id (UUID)` — item identifier.
- `request_id (UUID)` — parent request.
- `label (VARCHAR 200)` — required document.
- `position (INTEGER)` — display order, unique per request.

**documents**

- `id (UUID)` — document identifier.
- `request_item_id (UUID, unique)` — one file per item.
- `storage_key (VARCHAR)` — private storage key.
- `original_name (VARCHAR 255)` — original filename, sanitized before storage.
- `mime_type (VARCHAR 100)` — server-detected content type.
- `size_bytes (BIGINT)` — file size.
- `sha256 (CHAR 64)` — checksum for integrity checks.
- `uploaded_at (TIMESTAMPTZ)` — upload time.

### Relationships

- `users` **1:N** `document_requests`
- `users` **1:N** `sessions`
- `users` **1:N** `account_tokens`
- `document_requests` **1:N** `request_items`
- `request_items` **1:1** `documents`

### Data Considerations

**Consistency:**

- One transaction for request creation.
- Delete the stored file if the metadata insert fails.

**Duplicates:**

- The unique constraint on `request_item_id` turns a double upload into a `409`.

**Cascades:**

- Every foreign key is `ON DELETE CASCADE`, so deleting a request clears its items.
- Stored objects are removed separately.

**Indexes:**

- (owner_id, created_at, id) for lists.
- token_hash for portal lookups.
- request_id for items.
- (user_id) and token_hash for sessions.
- token_hash for account tokens.

**Constraints:**

- A request holds 1–10 items, checked in the transaction that creates them.
- Item position is 1 to 10 and unique per request, enforced by the database.

**Scaling:**

- one primary database; add a read replica only if measured.

**Retention:**

- files stay until the request is deleted.

## API Design

Versioned REST under `/api/v1`.

`GET /health: 200 Health` — application Health Check.

### Authentication

We defined the core endpoints we need for the design and rest live at authentication.md

- `POST /auth/register: 201 User` — register an owner and sign them in.
- `POST /auth/login: 200 Session` — sign in an owner.
- `POST /auth/logout: 204` — end the session.
- `GET /auth/session: 200 Session` — resolve the caller, used on app boot.
- `DELETE /auth/account: 204` — delete the owner and everything it owns.

### Document Requests

We defined the core endpoints we need for the design and rest live at document-request.md

- `POST /requests: 201 CreatedRequest` — create a request; includes the magic link.
- `GET /requests: 200 Paginated<Request>` — list own requests with progress.
- `GET /requests/{id}: 200 Request` — request with documents and signed download URLs.
- `POST /requests/{id}/revoke: 200 Request` — revoke the link.
- `DELETE /requests/{id}: 204` — delete the request and its files.

### Client Portal

We defined the core endpoints we need for the design and rest live at client-portal.md

- `GET /portal/{token}: 200 PortalView` — required documents and status.
- `POST /portal/{token}/items/{itemId}/file: 200 PortalView` — upload one file.

### File Limits

We defined the core limits we need for the design and rest live at docs/features/\*.md

Enforced server-side:

- **Names:** The original filename is stored for display only; rest server-generated.
- **Maximum size:** `25 MB` per file, rejected with `413` before the body is buffered.
- **Allowed types:** PDF, JPEG, PNG, DOCX, XLSX, CSV, TXT.
- **Validation:**
    - The type is sniffed from content, never from the Content-Type header.
    - It must match the allowlist and agree with the extension; any mismatch is 415.
- **Labels:** item labels are owner-supplied, so they are escaped on output.

### API Considerations

**Auth:**

- Owner endpoints need a session cookie.
- Portal endpoints use the magic link instead.

**Isolation:**

- Scope owner queries by `owner_id`.
- Another owner's resource returns 404, never 403.

**Links:**

- Unknown, expired, and revoked links return the same 410.
- So a response never reveals whether a token existed.

**Errors:**

- One JSON shape: `{ "error": { "code", "message", "details" } }`.
- `message` is human-readable.
- `code` is a stable machine string such as `invalid_link`.
- `details` is an optional field-by-field map for validation errors.
- See the table below for status codes.

**Pagination:**

- Cursor-based, `limit` defaults to `20` and is capped at `100`.
- Cursors are opaque and encode `(created_at, id)`.

**Rate Limiting:**

- Unauthenticated and portal buckets key on the client IP.
- Authenticated buckets key on `user_id`, falling back to the client IP.
- Counters live in the database so limits hold across instances.
- See the limits below.

**CSRF:**

- Owner endpoints require a session cookie plus a matching CSRF token.
- Required because they are cookie-authenticated.

**Lifetimes**

| Setting             | Value                        |
| :------------------ | :--------------------------- |
| Magic link expiry   | 14 days default, 90 days max |
| Session cookie      | 7 days, absolute             |
| Signed download URL | 5 minutes                    |
| Token entropy       | `256-bit random`             |
| Account token       | 60 minutes, single-use       |

**Rate Limits**

| Endpoint                             | Limit          |
| :----------------------------------- | :------------- |
| `POST /auth/login`, `/auth/register` | 10 per minute  |
| `POST /auth/password/forgot`,        | 5 per hour     |
| `POST /auth/email/resend`,           | 5 per hour     |
| `GET /portal/{token}`                | 60 per minute  |
| `POST /portal/.../file`              | 30 per hour    |
| Owner reads and writes               | 120 per minute |

## Architecture

### Core Components

- **UI** — owner dashboard and client portal, served as a single page application (SPA).
- **API** — auth, authorization, and business rules, exposed as a versioned API.
- **Relational Database** — users, sessions, requests, items, and file metadata.
- **Object Storage** — private S3-compatible bucket (RustFS in development).
- **Queue Worker** — sends account emails.
- **Cleanup Scheduler** — drains the PostgreSQL storage-deletion outbox on a one-minute schedule.

### High-Level Design

```text
Browser (owner or client)
    |
    |  HTTPS, one origin
Application (UI assets + API)
    |
    +-----> PostgreSQL        users, sessions, requests, metadata
    |
    +-----> Object Storage    private files, signed URLs
    |
Response
```

- **Owner auth** — server-managed secure session cookie plus a CSRF token, same origin.
- **Client auth** — no auth; the magic link in the URL path authenticates each request.
- **Boundary** — auth sessions and magic links are separate; each reaches its own data.

### Request Lifecycle

```text
Create Request
    |
Validate Input
    |
Create Request + Items
    |
Generate Magic Link
    |
Store Token Hash
    |
Share Link
    |
Client Uploads Files
    |
Track Progress
    |
Complete / Revoke / Delete
```

### File Lifecycle

```text
Upload File
    |
Enforce Size Cap While Streaming
    |
Sniff MIME Type From Content
    |
Validate Against Allowlist + Extension
    |
Generate Random Storage Key
    |
Store in Private Object Storage
    |
Save File Metadata
    |
Generate Signed Download URL
    |
Download
    |
Delete with Document or Request
```

### Detailed Design

**Request creation**

Create the request, required items, and magic-link hash in one database transaction.

**Magic links**

Generate a 256-bit random token, store only its SHA-256 hash, and validate hash, expiry, and revocation together.

**Owner isolation**

Scope every owner resource query by `owner_id`.

**File uploads**

Enforce the size cap while streaming, sniff the MIME type from content, and require it to match both the allowlist and the extension before storing under a random private key.

**Upload races**

when a `409` happens, remove the object the losing request already wrote.

**Document deletion**

the owner can delete one uploaded document, so the item returns to waiting and the client can re-upload; progress therefore moves backwards.

- **Link reuse**

a magic link stays usable until it expires or is revoked, since a client must be able to leave and return.

**Resumability**
progress is derived, so a client can return later and finish the rest.

**File consistency**

Remove the stored file if database persistence fails; if cleanup fails, persist its key in the storage-deletion outbox when the database is available.
**File downloads**

Authorize through the API, then return a 5-minute signed URL with attachment and nosniff.

**Deletion**

Delete metadata and record storage keys in one database transaction. A scheduled outbox processor removes stored objects after commit and retries failures.

**Progress**

Derive completion from required items and uploaded documents rather than storing separate status.

**Scaling**

Hold no auth state in the app, so instances scale horizontally. Sessions, rate limits, and progress all live in PostgreSQL, so a new instance needs no warm-up.

## Trade-offs

**Magic Links**

- Benefit: simpler client access without accounts.
- Cost: secure token handling, expiry, and revocation.
- A client who leaves halfway can return; expiry and revocation end the link.

**Owner-Delivered Links**

- Benefit: the owner shares the link over their own channel.
- Avoids deliverability, bounce handling, and consent.
- Cost: one manual step.

**One File Per Item**

- Benefit: progress is unambiguous, and a duplicate upload is a 409.
- Cost: a 10-item request means 10 uploads.
- The portal absorbs this with a single screen, any-order uploads, and resumability.

**Token in the URL Path**

- Benefit: a client pastes one link and lands on the portal.
- Cost: tokens can leak through referrers, history, and logs.
- Mitigated with no-referrer, no third-party assets, and log stripping.

**Server-Side Uploads**

- Benefit: validation happens before storage.
- Cost: consumes application resources during uploads.
- Alternative: presigned direct uploads, rejected for losing pre-storage validation.

**Private Object Storage**

- Benefit: files are protected by default.
- Cost: signed URL handling for downloads.

**Derived Progress**

- Benefit: no stale status.
- Cost: completion is calculated from request items and documents.

**Database-Backed Sessions**

- Benefit: the app holds no auth state, so instances scale horizontally.
- Revocation is trivial, and a database leak yields no usable cookie.
- Cost: shared external state, and one indexed lookup per authenticated request.
- Sessions and rate-limit counters live in PostgreSQL.
- So scaling means more app instances against one database.

**Queue for Account Email Only**

- Benefit: a provider outage never blocks a request.
- Cost: a worker to run, and a job that can be lost on restart.
- The token is stored before dispatch, so a lost job is recoverable by resend.
- No cache is needed.

**Durable Storage Cleanup**

- Benefit: cleanup intent is committed with metadata deletion and survives restarts.
- Cost: a separate scheduler and outbox table, plus brief orphan-object retention while retries run.
- S3 deletion is retried every minute; failures are reported and remain pending.

## Bottlenecks

### Identify bottlenecks

- **File uploads** — Large or concurrent uploads can consume application resources.
- **Request lists** — Growing request data can increase database query cost.
- **Portal lookups** — Every client request requires magic-link validation.
- **Storage consistency** — Database and object storage can fail independently.
- **Uploads saturate first** — a rising upload p95 exhausts the app workers.

### Resolved bottlenecks

- **File uploads** — Enforce size limits and upload rate limits.
- **Request lists** — Use indexed owner queries with cursor pagination.
- **Portal lookups** — Use a unique index on the token hash.
- **Storage consistency** — Clean up stored files when metadata persistence fails.

## Development

**Implementation**

- **Auth** — session cookie plus a CSRF token for the app UI; see auth-and-access.md.
- **Requests** — request, items, and link hash created in one transaction.
- **Portal** — validate link, accept upload, track completion; see features/\*.md.
- **Storage** — private storage behind an interface; S3-compatible bucket in production.
- **Queue** — A single worker for asnyc tasks; jobs retry with backoff and failure log.
- **Migrations** — Versioned applied by a migration step before the new version release.
- **API docs** — OpenAPI and Postman collection checked in CI against the running app.

**Key Decisions**

- **Hash magic links** — a database leak exposes no working links.
- **Derived progress** — no status column to contradict the files.
- **API-first** — business rules live behind the API, independent of the UI.
- **Private storage** — no direct public access to files.
- **File content** — a client-declared Content-Type proves nothing.

## Performance

**Performance Considerations**

- **Indexes** — cover owner-scoped request lists, token lookups, and session lookups.
- **Pagination** — cursor pagination keeps list cost predictable regardless of table size.
- **Uploads** — stream to storage with a hard size; never buffer a whole file in memory.
- **Downloads** — serve through signed storage URLs, not with application api.

**Target Benchmarks**

Measured with k6 on the deployed demo. Replace with real results.

- **Request list (1,000 requests)** — p95 under `200 ms`.
- **Portal lookup** — p95 under `150 ms`.
- **5 MB upload** — under `3 s`, excluding network latency.
- **Error rate** — under `1%`.

## Testing

**Unit Tests**

- Magic-link generation, hashing, expiry, and revocation.
- File validation for size, allowlist membership, and extension/content agreement.
- Progress calculation, including partial completion and duplicate-upload rejection.
- Error formatting, including details for validation errors.
- Pagination cursor encode and decode.

**Feature Tests**

- Every endpoint has at least one test, including the health endpoint.
- Owner isolation: another owner's data returns 404.
- Unauthenticated owner requests return 401.
- Owner requests with a valid session but no CSRF token are rejected.
- Valid, expired, revoked, and tampered links.
- Unknown, malformed, expired, revoked, and tampered links return an identical 410 body.
- Second upload to the same item returns 409.
- Oversized, disguised, and malformed files are rejected with 413 or 415.
- Rate-limited requests return 429 and a Retry-After header.
- Deleting a request removes its stored files.
- Deleting a session invalidates its cookie.
- Password reset, email verification, and account deletion, each covered end to end.
- Account emails are asserted through a faked queue, never a live send.

**End-to-End Tests**

- Owner creates a request, client uploads, owner downloads.
- Upload is blocked after the link is revoked.
- Invalid links show the error screen.
- Files are not reachable from public storage.
- One browser test runs the main flow through the UI in CI.

## Deploy

**Environments**

- **Demo** — a production-like environment where the k6 benchmark runs.
- **Local** — Docker Compose for the application, PostgreSQL, and RustFS.
- **Staging** — production-like environment for deployment and integration checks.
- **Production** — PostgreSQL and object storage with single app instance scale.

**Deployment Flow**

```text
Push -> CI (lint, analysis, tests) -> Build -> Migrate -> Deploy -> Health Check
```

**Production Services**

- **App container** — serves the API and built UI assets from one origin.
- **Database** — Relational Database Management System such as PostgreSQL.
- **Object storage** — private S3-compatible bucket.

**Production Monitoring**

- **Health check** — application and database availability via GET /health.
- **Structured logs** — no tokens, session cookies, or portal paths.
- **Uptime check** — external ping on the health endpoint.
- **Signals to watch** — upload p95, 429 rate, database connection pool saturation.
- **Backups** — daily database snapshots; object storage owns file durability.

**Production Security**

- HTTPS only.
- Session cookies are HttpOnly, Secure in production, and SameSite=Lax.
- Private bucket with 5-minute signed URLs.
- Tokens never stored or logged in plaintext.
- Secrets outside source control.
- Least-privilege database and storage credentials.
- Portal pages set Referrer-Policy: no-referrer and load no third-party assets.

## Release

**Release Strategy**

Trunk-based: small changes merged to main after CI passes.

**Release Flow**

```text
Merge -> CI -> Tag -> Migrate -> Deploy -> Health Check
```

**Versioning**

- **App** — semantic tags such as `v1.0.0`.
- **API** — versioned paths; breaking changes use `/api/v2`.

**Rollout**

- Run migrations before switching traffic, as a separate step from the deploy.
- Verify health checks and the main flow after deploy.

**Rollback**

- Redeploy the previous version.
- Migrations are additive, so a rollback never needs a down-migration.
- Database columns are never dropped or renamed in the same release that stops using them.

## Discussion

- **Future work** — Notifications, teams, retention, file scanning, and e-signatures.
- **Security** — Magic links require secure token handling, expiry, and revocation.
- **Storage** — PostgreSQL stores metadata while private object storage stores files.
- **Consistency** — Database transactions protect api state; storage failures require cleanup.
- **Scaling** — Start simple and add infrastructure when measured load requires it.
- **Files** — File content, size, and type must be validated before storage.
- **Abuse** — registration is open so rate limiting and owner isolation are the controls.
