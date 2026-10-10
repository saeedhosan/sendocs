# Document Requests — Technical Design

This document defines how document requests work for owners. It covers creating requests, sharing a magic link with a client, tracking upload progress, storing uploaded files, and managing requests from the owner dashboard.

## Scope

### In Scope

- Owner can create a document request with required items.
- Owner can share the created request: receive a magic link to the client.
- Owner can list requests with derived progress and view a single request.
- Owner can revoke the magic link and delete the document requests.
- Owner can delete an uploaded document or delete an entire request.
- The system validates, stores, and serves one file per item.
- The system deletes stored files together with their metadata.

### Out of Scope

- Token generation, hashing, validation related covered by secure-magic-link.md`.
- Portal pages, screens, and upload endpoints covered by client-portal.md.
- Owner authentication and auhoriziation covered by auth-and-access.md.
- Client own upload; the owner does this from the dashboard.
- Editing a request after creation, including labels and expiry.
- Email delivery of the magic link; the owner shares it.
- Progress notifications, reminders, and expiry warnings.
- Retention policies and scheduled deletion.

## UX and UI

**Routes**

- `/dashboard`, the signed-in request list.
- `/requests/new`, start a request.
- `/requests/{id}`, one request with its items, client link, and progress.

> Every route above requires a session. Owner screens are covered in owner-dashboard.md, and client screens in client-portal.md.

**User Flow**

```text
Owner
  |
Dashboard
  |
New Request
  |
Title and 1-10 Items Entered
  |
Request and Link Created
  |
Link Shown Once
  |
Copy and Share
  |
Client Uploads
  |
Owner Reads, Downloads, Revokes, or Deletes
```

**Foundation Screens**

- Request list, with status, progress, labels, and updated time
- New request, with dynamic item rows and validation
- Request detail, with per-item status and file actions
- Link revealed once, copy-first with a manual copy fallback

**Navigation Screens**

- New request, from the dashboard
- Dashboard, from a request detail
- Client link, copyable from a request detail
- Sign out, from the dashboard nav

**Discovery Screens**

- No requests yet
- Link expired or revoked
- Item count below 1 or above 10
- Upload rejected (size or type)
- Document deleted or unavailable at download time
- Revoke, document-delete, and request-delete confirmations (all destructive)
- Request complete
- Signed out or session expired

## Data Design

**document_requests**

| Column       | Type          | Key / Constraint  | Purpose                     |
| ------------ | ------------- | ----------------- | --------------------------- |
| `id`         | `UUID`        | `PK`              | Request identifier.         |
| `owner_id`   | `UUID`        | `FK > users.id`   | Request owner.              |
| `title`      | `VARCHAR 200` | `NOT NULL`        | Display title.              |
| `token_hash` | `CHAR 64`     | `UNIQUE NOT NULL` | the magic link has.         |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL`        | The max time.               |
| `revoked_at` | `TIMESTAMPTZ` | nullable          | Set when the owner revokes. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`        | Creation time.              |

**request_items**

| Column       | Type          | Key / Constraint | Purpose                 |
| ------------ | ------------- | ---------------- | ----------------------- |
| `id`         | `UUID`        | `PK`             | Item identifier.        |
| `request_id` | `UUID`        | `FK`             | Parent request.         |
| `label`      | `VARCHAR 200` | `NOT NULL`       | A friendly name.        |
| `position`   | `INTEGER`     | `NOT NULL`,      | Display order, 1 to 10. |

**documents**

| Column            | Type          | Key / Constraint | Purpose                  |
| ----------------- | ------------- | ---------------- | ------------------------ |
| `id`              | `UUID`        | `PK`             | Document identifier.     |
| `request_item_id` | `UUID`        | `FK`,            | One file per item.       |
| `storage_key`     | `VARCHAR`     | `NOT NULL`       | Private key.             |
| `original_name`   | `VARCHAR 255` | `NOT NULL`       | Client filename readonly |
| `mime_type`       | `VARCHAR 100` | `NOT NULL`       | Server-sniffed type      |
| `size_bytes`      | `BIGINT`      | `NOT NULL`       | Stored file size.        |
| `sha256`          | `CHAR 64`     | `NOT NULL`       | Content checksum.        |
| `uploaded_at`     | `TIMESTAMPTZ` | `NOT NULL`       | Upload time.             |

**Indexes:**

- `document_requests (owner_id, created_at, id)` — the owner-scoped list cursor
- `document_requests (token_hash)` unique — the only portal lookup
- `request_items (request_id, position)` — ordered items for a request
- `documents (request_item_id)` unique — also what turns a double upload into a 409

**Relationships:**

- `users` **1:N** `document_requests`
- `document_requests` **1:N** `request_items`
- `request_items` **1:1** `documents`

> Every foreign key cascades, so deleting a request clears its items and documents in one statement. Stored objects are removed separately. Session and account token tables are covered in auth-and-access.md

## API Design

### Requests

**POST /api/v1/requests** — Create a request with its required items.

- **Payload:** `title`, `items` (1–10 labels, in display order)
- **Response:** `201` — request, items, and the magic link, shown once
- **Failure:** `401` — no valid session
- **Failure:** `422` — title or item count out of range, with per-field details
- **Failure:** `429` — rate limited (120 per minute)

**GET /api/v1/requests** — List the caller's own requests with progress.

- **Payload:** `limit`, `cursor` (query parameters)
- **Response:** `200` — a page of requests, each with counts and an nextCursor
- **Failure:** `401` — no valid session
- **Failure:** `422` — malformed cursor
- **Failure:** `429` — rate limited (120 per minute)

**GET /api/v1/requests/{id}** — One request with its items and signed download URLs.

- **Payload:** none; session cookie
- **Response:** `200` — title, expiry, revoked state, items, and a signed URL per-item
- **Failure:** `401` — no valid session
- **Failure:** `404` — not found, or owned by another owner
- **Failure:** `429` — rate limited (120 per minute)

**POST /api/v1/requests/{id}/revoke** — Revoke the magic link.

- **Payload:** none; session cookie plus CSRF header
- **Response:** `200` — the request with revokedAt set
- **Failure:** `401` — no valid session
- **Failure:** `404` — not found, or owned by another owner
- **Failure:** `429` — rate limited (120 per minute)

**DELETE /api/v1/requests/{id}/items/{itemId}/document** — Delete one uploaded document.

- **Payload:** none; session cookie plus CSRF header
- **Response:** `204` — no content
- **Failure:** `401` — no valid session
- **Failure:** `404` — no such item on the caller's request, or no document on the item
- **Failure:** `429` — rate limited (120 per minute)

**DELETE /api/v1/requests/{id}** — Delete the request and every file in it.

- **Payload:** none; session cookie plus CSRF header
- **Response:** `204` — no content
- **Failure:** `401` — no valid session
- **Failure:** `404` — not found, or owned by another owner
- **Failure:** `429` — rate limited (120 per minute)

> Every write above can also return 403 csrf_failed on a stale or missing
> X-CSRF-Token, as defined in auth-and-access.md. This is listed once in the error table.

### Core Components

**RequestController** — Owner request endpoints, validation, and error mapping.

- `store(Request $r): JsonResponse`
- `index(Request $r): JsonResponse`
- `show(Request $r, string $id): JsonResponse`
- `revoke(Request $r, string $id): JsonResponse`
- `destroy(Request $r, string $id): Response`
- `destroyDocument(Request $r, string $id, string $itemId): Response`

**RequestService** — Create, read, revoke, and delete requests.

- `create(User $u, string $title, array $labels): CreatedRequest`
- `findForUser(User $u, string $id): DocumentRequest`
- `revoke(User $u, string $id): DocumentRequest`
- `delete(User $u, string $id): void`
- `paginate(User $u, Cursor $c, int $limit): Page`

**MagicLinkService** — Build the link for a newly created request.

- `issue(DocumentRequest $r): string` — returns the raw link, once
- `hash(string $token): string`
- `expiryFor(int $ttlDays): Carbon` — delegates to policy in `secure-magic-link.md`

**ProgressCalculator** — Derive progress from items and documents.

- `forRequest(string $requestId): Progress` — one query, no stored status
- `forRequests(array $requestIds): array` — batched for the list endpoint

**DocumentService** — Validate, store, and serve one file per item.

- `upload(RequestItem $i, UploadedFile $f): Document`
- `findForItem(string $itemId): ?Document`
- `deleteForItem(RequestItem $i): void`
- `deleteForRequest(string $requestId): void`
- `signedUrlFor(Document $d): string` — 5 minutes, `attachment` and `nosniff`

**FileValidator** — Size, content type, and extension checks.

- `assertSize(UploadedFile $f): void` — `413` over the cap
- `assertType(UploadedFile $f, string $originalName): string` — returns the sniffed type
- `sniff(Stream $s): string` — reads magic bytes, never the `Content-Type` header

**StorageService** — Private object storage behind an interface.

- `put(string $key, Stream $s): void`
- `presignedGet(string $key, int $ttlSeconds): string`
- `delete(string $key): void`
- `deleteMany(array $keys): void`

**StorageDeletionOutbox** — Persist storage cleanup intent in PostgreSQL and retry it outside the request path.

- `enqueue(array $storageKeys): void` — inserts keys in the caller's transaction
- `processBatch(): int` — attempts up to 100 pending deletions and keeps failures for retry

## Low-Level Design

**Request Creation**

- The request, its items, and the magic-link hash are inserted in one transaction.
- title is trimmed, collapsed, and capped at 200 characters.
- An empty or whitespace-only title is 422, not silently replaced.
- The magic link is built only after the commit succeeds, from app url and raw token.
- The raw token is returned exactly once and is never recoverable afterward.

**Document Items**

- Count must be 1–10, checked in the same transaction.
- Items are immutable after creation.
- Database enforces position between 1–10 and uniqueness per position.
- position comes from array order, renumbered from 1.
- Labels are trimmed and capped at 200 characters; empties return 422.
- Duplicate labels are allowed.
- Unique constraint on (request_id, position) prevents ordering mistakes.

**Magic Link Issuance**

- The token is generated, hashed, and given its expiry by secure-magic-link.md.
- The request row is insert token_hash and expires_at in the same transaction.
- No per-request TTL is provided at creation.

**Revocation**

- Revocation sets revoked_at; the row is not deleted.
- Revocation is idempotent (second call returns 200).
- Owner can still read the request and download files after revoking.
- Client behavior for revoked or expired links is defined in secure-magic-link.md.

**Progress Tracking**

- Progress = (uploaded / total), never stored.
- No status column.
- List computes via one grouped query over page request IDs (no N+1).
- Complete when all items uploaded.
- total is never zero.

**Upload Validation**

- The API checks the 25 MiB file cap after PHP parses the multipart upload; it does not load the full file into application memory.
- Over 25 MiB returns the standard `413` envelope. PHP `post_max_size` overflow is mapped to the same response; the proxy retains a separate outer body-size ceiling.
- MIME type sniffed from content bytes, not Content-Type header.
- Sniffed type must be in allowlist and match file extension.
- Allowed: PDF, JPEG, PNG, DOCX, XLSX, CSV, TXT.
- Mismatch or unrecognized type returns 415.
- Extension checked on client filename.

**Storage**

- Storage key is server-generated random value, not derived from filename.
- Keys namespaced by request ID.
- Bucket is private with no public path.
- sha256 computed during the same stream.
- File stored before metadata insert to allow cleanup on failure.

**Upload Races**

- If two uploads race, one loses on the unique constraint.
- Loser returns 409 duplicate_upload and deletes the object it wrote.
- Cleanup runs after failed insert; does not rollback successful request.
- Cleanup failures are queued, not returned.

**Downloads**

- API authorizes by caller's owner_id.
- Returns presigned URL valid for 5 minutes; bytes never pass through app.
- URL response sets attachment and nosniff.
- Signed URLs not logged; expire in minutes.
- Items with no document return no URL.

**Document Deletion**

- Deleting a document returns the item to waiting.
- Item must belong to caller's request; foreign itemId returns 404.
- No document returns 404.
- Key and metadata deletion are recorded in one database transaction; the scheduled outbox processor deletes the object after commit.
- Progress moves backwards (derived).

**Request Deletion**

- Metadata deleted first in a cascading statement.
- Storage keys collected before deletion.
- Cleanup keys are inserted into the outbox in the same transaction as the cascading metadata delete.
- Owner gets 204 once the database transaction commits; cleanup retries independently.
- Deletion is not reversible (UI confirms).

**Pagination**

- Cursor-based on (created_at, id), descending.
- limit defaults to 20, capped at 100.
- Opaque base64 cursor; tampered returns 422.
- id breaks ties.
- No offset; cost stays flat.

**Token Hygiene**

- Magic link returned only at creation.
- GET /requests/{id} returns items and signed URLs; never token hash or link.
- Access logs drop path segment after /api/v1/portal.
- Storage keys are secrets and not logged.

## Trade-offs

**Owner-Delivered Links**

- Benefit: the owner shares the link over their own channel.
- Avoids deliverability, bounce handling, and consent.
- Cost: one manual step, and the owner can paste it into the wrong place.
- Alternative: emailing the link, rejected because deliverability becomes the product's problem.

**One File Per Item**

- Benefit: progress is unambiguous, and a second upload is a clean 409.
- Cost: a 10-item request means 10 uploads.
- The portal absorbs this with one screen, any-order uploads, and resumability.
- Alternative: multiple files per item, rejected because progress stops meaning anything.

**Derived Progress**

- Benefit: no status column to contradict the files.
- Cost: progress is computed on read rather than stored.
- The list endpoint batches it in one grouped query, so the cost is a single extra query per page.

**Server-Side Uploads**

- Benefit: size and type are validated before anything is stored.
- Cost: application resources are consumed during the upload.
- Alternative: presigned direct uploads, rejected because they give up pre-storage validation.

**Private Object Storage with Short-Lived URLs**

- Benefit: files are protected by default, and the app never proxies file bytes.
- Cost: every download needs a signed URL and a second request.
- Alternative: a permanent public URL, rejected because filenames and request ids would leak.

**Database Constraint as the Duplicate Guard**

- Benefit: the unique index is the only race-safe check, so no lock is needed.
- Cost: one wasted upload and one delete on the losing request.
- Alternative: an advisory lock, rejected as more machinery for the same guarantee.

**Delete Without Soft Delete**

- Benefit: one statement clears the request, its items, and its documents.
- Cost: no recovery, and no record that a request ever existed.
- Alternative: a deleted_at column, rejected because the files are gone anyway.

**Cursor Pagination Only**

- Benefit: list cost stays flat as requests accumulate.
- Cost: no page numbers and no jumping to an arbitrary page.
- Alternative: offset pagination, which degrades on deep pages and can skip rows.

## Security

**Link Secrecy**

- The link is returned once, at creation, and never again by any endpoint.
- Everything else about it, including hashing, logging, and referrers

**Owner Isolation**

- Every request query is scoped by the caller's owner_id in the WHERE clause.
- Another owner's request returns 404 with a body identical to a nonexistent id.
- The same rule covers items and documents, reached through the request.

**File Validation**

- The type comes from content, never from a client-declared header.
- The allowlist is seven types, so clients can check before uploading.
- The sniffed type must also agree with the extension, catching a renamed file.
- The size cap. is always enforced, so an oversized upload is never fully received.

**Storage Access**

- The bucket is private, with no public path to any object.
- Storage keys are server-generated, so a bucket listing reveals nothing useful.
- Downloads are authorized in the API, then served through a 5-minute presigned URL.
- A signed URL cannot be used against a different object because its bound to one key.

**Output Handling**

- Titles are owner-supplied and are escaped on every output path, including the portal.
- original_name is stored for display only and is never used to build a path or a key.
- Filenames are stripped of folder component before stored so ../../etc/passwd is inert.

**Abuse**

- Uploads are capped 30 per-hour-IP, which still covers a 10-item request plus retries.
- Portal reads are capped at 60 per minute per IP.
- Owner endpoints are capped 120 per-min, so compromised session cant enumerate.
- Storage is bounded by upload limits, keeping abuse costs tied to the paid bucket.

**Deletion**

- Request deletion removes metadata in one statement and stored objects behind it.
- Object deletion is retried by the scheduled outbox processor; persistent failures remain visible for operational follow-up.
- Nothing is recoverable by design, which is why the UI confirms before deleting.

## Performance

**List query**

- (owner_id, created_at, id) lets the cursor query avoid sorting.

**Pagination**

- cost is flat regardless of how many requests the owner has.

**Progress**

- One grouped query per page, not per request, keeping round trips fixed.

**Uploads**

- Size and content are validated before storage; the API then streams the PHP temporary file to private storage without loading the full file into application memory.

**Sniffing**

- reads only the first few KB, so validation cost is independent of file size.

**Downloads**

- served by object storage, not the app, so file bytes never consume app resources.

**Deletion**

- one cascading statement, then object deletion off the request path.

**Connection**

- Request endpoints hit the database on nearly every call.
- Pool saturation is the signal to watch.

## Error Handling

| Status | Code                | Cause                                                          |
| ------ | ------------------- | -------------------------------------------------------------- |
| `401`  | `unauthenticated`   | Missing, malformed, unknown, or expired session.               |
| `403`  | `csrf_failed`       | Valid session, missing or mismatched token.                    |
| `404`  | `not_found`         | Request, item, or document missing, or owned by another owner. |
| `409`  | `duplicate_upload`  | The item already has a file.                                   |
| `413`  | `file_too_large`    | Over 25 MiB or PHP request-size limit exceeded.                |
| `415`  | `unsupported_type`  | Sniffed type not allowed, or extension mismatch.               |
| `422`  | `validation_failed` | Title, item count, or cursor out of range.                     |
| `429`  | `rate_limited`      | Bucket exhausted; includes Retry-After.                        |
| `500`  | `internal_error`    | Unexpected failure, with a correlation id.                     |

410 invalid_link is not listed here because no owner endpoint returns it: dead links
belong to the portal surface, defined in secure-magic-link.md.

**Response Shape**

- `{ "error": { "code", "message", "details" } }`, the same shape as every other endpoint.
- `details` carries a field map for title and item-count failures.

**Uploads**

- Size failure returns `413`; PHP or the proxy may already have received or buffered request bytes before Laravel responds.
- Type failure returns 415 with the detected type, not the client header.
- Lost race returns 409; the losing object is deleted after response.
- Object store failure returns 500; no metadata is written.

**Deletion and Cleanup**

- Metadata is deleted and cleanup intent is recorded atomically, so storage outages cannot leave orphan rows.
- Object deletion failure remains in the durable outbox and is reported, not returned to the owner.
- Owner gets 204 once the database is clean.
- Deleting a document twice returns 404, not 204.

**Revocation**

- Revoking an already-revoked link returns 200, not 409.
- A revoked request is still readable by its owner; only the client link dies.

## Testing

**Unit Tests**

- Item count boundaries: 0 rejected, 1 accepted, 10 accepted, 11 rejected.
- Positions are renumbered from 1 and survive duplicate labels.
- Title trimming, whitespace collapse, the 200-character cap, and empty rejection.
- Progress: zero uploaded, partial, complete, and never a divide by zero.
- Cursor encode and decode, including a tampered cursor.
- Type sniffing against a real PDF, JPEG, PNG, and a renamed text file.
- Extension agreement for every allowed pair, and rejection for a mismatch.

**Feature Tests**

- Create returns 201 with items in the submitted order and a magic link.
- The link appears once; a later GET /requests/{id} never returns it.
- Create with 0 or 11 items returns 422 and writes nothing.
- Create with a duplicate label succeeds.
- List returns only the caller's requests, newest first.
- limit defaults to 20, caps at 100, and rejects 101.
- Cursor paging returns every request once, even with same-millisecond creations.
- Another owner's request returns 404, identical to a nonexistent id.
- Revoke returns 200 with revokedAt; a second revoke is also 200.
- After revocation the owner can still read the request and download its files.
- Delete returns 204 and removes the request, its items, and its documents.
- Delete a document returns 204; a second call is 404; a foreign itemId is 404.
- Deleting a document removes its object and allows re-upload.
- A second upload to the same item returns 409 and the stored file is the first one.
- A 25 MB file is accepted; 25 MB plus one byte is 413.
- A text file renamed to .pdf is 415; a real PDF named .txt is 415.
- A false Content-Type header is ignored in favor of the sniffed type.
- An unsupported type, such as a zip, is 415.
- A download URL works once and is 404 for another owner's document.
- Deleting a request removes its objects from the bucket.
- Uploads are capped at 30 per hour per IP, with Retry-After on the rejection.
- A request with 10 items uploads all 10 within the hourly budget.

**End-to-End Tests**

- Owner creates a request, client uploads, owner tracks progress and downloads.
- Revoke the link, reopen the URL, and confirm the error screen.
- A client leaves the portal halfway and returns to finish the rest.
- A file in the bucket is not reachable from any public path.
- Delete a request and confirm its files are gone from storage.
- Owner delete a mis-uploaded document, then re-upload it.

## Open Questions

**Replacing a File**

- A second upload returns 409; replacement requires delete, then re-upload.
- Open: tell the client the item was cleared, or give the owner a swap action?
- Option: Keep the current two-step flow.
- Option: Add an owner-driven swap action.

**Reissuing a Link**

- Revocation is permanent; a new request is required.
- Open: allow link regeneration for unrevoked requests?
- Option: Keep links immutable after creation.
- Option: Allow regeneration while the link is active.

**Duplicate Labels**

- Duplicate labels are allowed.
- Open: disambiguate repeated labels with a number?
- Option: Keep duplicate labels as entered.
- Option: Append numbers to repeated labels.

**Extending Expiry**

- Expiry is fixed at creation.
- Open: allow extending an unexpired link?
- Option: Keep expiry fixed.
- Option: Allow extension and record the original expiry.

**Storage Reconciliation**

- Failed object deletion is queued for retry.
- Open: add a scheduled sweep for objects without metadata?
- Option: Rely on queued retries and operator cleanup.
- Option: Add a scheduled reconciliation sweep.

**Reclaiming Failed Uploads**

- Failed uploads leave queued cleanup.
- Open: how long should retries run before abandoning the object?
- Option: Retry indefinitely.
- Option: Retry for a fixed window, then flag for cleanup.
