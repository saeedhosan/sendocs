# Sendocs API — Progress Summary and Next Steps

As of October 9, 2026, Sendocs has a substantial backend foundation. We've implemented the main document-request flows and addressed several security, storage-reliability, and CI issues. The next goal is to audit the entire API for correctness and security, close remaining gaps, and establish that it is stable before starting the frontend.

## 1. What we've completed

### Core API features

| Feature              | Work completed                                                                          |
| -------------------- | --------------------------------------------------------------------------------------- |
| Authentication       | Registration, login/logout, session handling, account verification and recovery flows   |
| Document requests    | Create requests with 1–10 items, list and view requests, revoke links, delete requests  |
| Secure client portal | Resolve magic links, read request details and upload documents without a client account |
| Document downloads   | Generate short-lived signed download URLs                                               |
| Document deletion    | Delete document metadata and arrange stored-file cleanup                                |
| Progress tracking    | Derive progress from uploaded documents instead of storing a separate status            |
| API contract         | Maintain `docs/openapi.yaml` and feature documentation                                  |

The implementation follows the core security model: owner resources are scoped by `owner_id`; clients use magic links rather than owner sessions; and files are private.

### Security and reliability improvements

The following fixes have also been merged:

- PR #12 — Storage cleanup reliability: Added a database-backed outbox for failed file deletions, retry handling with exponential backoff, and scheduled cleanup.
- PR #14 — Storage write failures: Improved cleanup when an object-storage write fails.
- PR #15 — Magic-link log redaction: Prevented sensitive link tokens from leaking through access logs.
- PR #16 — OpenAPI version: Corrected the version declaration in the served API specification.
- PR #17 — Production logging and builds: Corrected safe Nginx access logging and separated production image builds from the fast CI workflow.
- PR #18 — Consistent HTTP errors: Standardized API responses for unknown routes and unsupported methods, added tests, and improved oversized-upload error handling.

PRs #14–#18 are now merged.

### CI and production build validation

The latest PR #18 workflow runs are both successful:

- &#x20;API and Web CI
- &#x20;Production Docker image builds

This validates those workflows for the current changes. It does not yet establish that every API edge case is covered or that the application is production-ready.

## 2. Important design constraints to preserve

These are not optional improvements; they're part of the existing design.

- Magic links: Store only the SHA-256 token hash. Unknown, expired and revoked links must return the same `410` response.
- Authorization: Every owner resource must be scoped to its owner. Another owner's resource returns `404`, not `403`.
- Sessions and CSRF: Owner endpoints use the session cookie and CSRF protection for state-changing requests.
- Uploads: One file per request item, 25 MiB maximum, content sniffing rather than trusting `Content-Type`, and validation against the allowlist and extension.
- Storage: Files remain private; downloads use five-minute signed URLs.
- Progress: Derive it from document records; do not persist a second status that can become inconsistent.
- Cleanup: Stored files must not be orphaned when metadata writes or deletion operations fail.
- Documentation: API contract changes update both the owning feature document and `docs/openapi.yaml`.

## 3. What needs to be worked on next

I'd tackle these in order, with small reviewable changes and CI validation for each.

1\. Authorization and security audit

Highest priority

- Verify owner isolation across every read, update, download, revoke and delete endpoint.
- Check session expiry, logout invalidation, CSRF enforcement and account-token expiry/reuse.
- Verify magic-link expiry, revocation, tampering and indistinguishable invalid-link responses.
- Check that sensitive tokens, passwords and file contents never appear in logs or error responses.

Deliverable: Focused security tests covering unauthorized and cross-owner access, plus fixes for any failures.

2\. Upload validation and HTTP error handling

- Test files exactly at the 25 MiB limit and just over it.
- Verify PHP upload errors, missing files, malformed multipart requests and unsupported file types.
- Ensure duplicate uploads consistently return `409`.
- Check that errors use the documented JSON envelope at every layer.

Important outstanding check: Removing Nginx's custom JSON response does not stop Nginx from rejecting requests above its `client_max_body_size` limit before Laravel receives them. Confirm the actual production behavior for oversized request bodies and decide how to preserve the API error contract without removing necessary infrastructure protection.

3\. Storage cleanup and concurrency

- Verify cleanup retries survive worker restarts and transient S3 failures.
- Test deleting requests with multiple uploaded documents.
- Check concurrent uploads to the same item and ensure the unique constraint reliably prevents duplicate documents.
- Review outbox retry exhaustion, repeated failures and scheduler behavior.
- Ensure database deletion and object-storage cleanup cannot silently leave permanent orphaned files.

Deliverable: Failure-path and concurrency tests for the database/object-storage boundary.

4\. OpenAPI and feature-contract audit

- Check every documented status code against actual controller and middleware behavior.
- Verify response schemas match the `{ "error": { "code": "...", "message": "..." } }` envelope.
- Inspect the reusable error schemas; there may be a mismatch between the envelope examples and the referenced `Error` schema.
- Confirm limits, validation rules, authentication requirements and rate limits match the implementation.

Deliverable: A consistent, trustworthy API contract rather than documentation that merely looks complete.

5\. Remaining edge cases and final regression pass

- Cursor pagination boundaries and stable ordering.
- Request/item limits, invalid identifiers and malformed input.
- Rate limiting across multiple application instances.
- Consistent errors for expired sessions and unavailable downloads.
- Full API test suite, static analysis, linting and production image builds.

Deliverable: A documented API readiness checklist with each item backed by tests or explicit evidence.

## 4. Recommended execution plan

| Phase | Goal                                  | Exit condition                                           |
| ----- | ------------------------------------- | -------------------------------------------------------- |
| 1     | Security and authorization            | Access-control tests pass; findings fixed                |
| 2     | Uploads and error envelopes           | Oversized and malformed requests behave consistently     |
| 3     | Storage reliability                   | Cleanup, retries and concurrency are verified            |
| 4     | OpenAPI contract                      | Schemas, examples, status codes and implementation agree |
| 5     | Full regression and deployment review | CI/build green; production configuration reviewed        |
| 6     | API readiness decision                | No known critical gaps; remaining limitations documented |

## 5. What we should not do yet

- Don't start the React frontend while API behavior is still being audited.
- Don't add new features simply to increase the project's scope.
- Don't refactor working code without a concrete correctness, security or maintainability reason.
- Don't treat a green CI run as proof that security and production behavior are fully verified.

My recommendation: Start with the authorization/security audit, then tackle upload error handling. They're the most consequential areas to verify before calling the backend stable. Keep each fix in a focused PR, update the relevant docs when behavior changes, and validate with CI before moving to the next area.

The goal is not to claim the API has no bugs; it's to build credible evidence that the important behaviors and failure modes have been tested.
