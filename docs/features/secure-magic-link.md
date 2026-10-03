# Secure Magic Link — Technical Design

A client is authenticated using a magic lin in the URL path. Only the token's SHA-256 hash is stored. This document covers issuing the token, validating it, expiry and revocation, and preventing credential leakage. Portal pages, uploads, and request details are covered in client-portal.md and document-requests.md.

## Scope

### In Scope

- Token generation, encoding, and hashing.
- Link revealed once at creation; cannot be reproduced.
- Validation on every link request: malformed, hash lookup, expiry, revocation.
- Expiry policy: 14 days default, max 90 days.
- Revocation: permanent, idempotent, cannot be regenerated.
- Non-disclosure: dead link indistinguishable from wrong link.
- URL credential leakage prevention.
- Blast radius of a valid link.

### Out of Scope

- Portal pages and screens covered by client-portal.md.
- Portal upload endpoints, size/type validation, progress covered: docs/features/\*.md.
- Full document_requests schema; only link-related columns.
- Owner create/revoke endpoints covered by document-requests.md.
- Owner sessions, cookies, CSRF covered by auth-and-access.md.
- Emailing links to clients owner shares manually.
- Client accounts, PINs, per-item codes.
- Regenerating or un-revoking links.
- Tracking, analytics, beacons.
- Short links, vanity URLs, redirects.

## UX and UI

**Routes**

- `/portal/{token}`, only route for links.
- Token only in path; never in query string or fragment.

**User Flow**

```text
Owner
  |
Request Created
  |
Link Revealed Once and Copied
  |
Client Opens
  |
Valid (Reusable Until Expired/Revoked)
  |
Expired or Revoked by Owner
```

**Foundation Screens**

- Dead link: one message for all failures, with a hint to ask the owner for a new link.

**Navigation Screens**

- Portal, owned by client-portal.md
- Link revealed once, owned by document-requests.md

**Discovery Screens**

- Link dead (typo, expired, or revoked) — identical message to client.
- Link revoked while open — next action returns dead link.

## Low-Level Design

**Generation**

- Generate 256 bits with a CSPRNG and encode as 43-character URL-safe base64.
- The token is opaque: no IDs, timestamps, counters, or other structure.
- Its entropy prevents guessing or meaningful modification.

**Hashing**

- Store SHA-256(token) as 64 lowercase hex characters.
- SHA-256 is sufficient because the token already has 256 bits of entropy.
- Lookup is a single indexed equality.

**One-Time Reveal**

- Build the link after the request transaction commits.
- Return the raw token only in the 201 creation response.
- The token is never returned again.

**Validation Order**

1. Reject malformed tokens without a query > 410.
2. Hash and look up token_hash.
3. Require revoked_at IS NULL.
4. Require expires_at > now().

- All failures return 410.
- One lookup resolves the request; subsequent data is scoped by its ID.

**Expairation**

- Default: 14 days; maximum: 90 days.
- Set once at creation and never extended.
- No expiry sweep is required; expired rows are pruned best-effort.

**Revocation**

- Set revoked_at; keep the row for the owner.
- Revocation is idempotent and permanent.
- Uploaded files remain available to the owner.
- Revoked links return the same 410 as unknown or expired links.

**Multi-Use, Not Single-Use**

- Links remain reusable until expiry or revocation.
- This allows clients to leave and return without losing progress.
- Leaked links remain usable until explicitly revoked or expired.

**The URL Is the Credential**

- The token is in the path; the entire URL is secret.
- Access logs redact the token segment.
- Portal responses require no-referrer and a strict CSP with no external sources.
- Browser history and the client's machine can still retain the URL.

**No Ambient Credential**

- The portal sets no cookie; each request carries the token in its path.
- This prevents cross-origin pages from using an ambient credential.
- Expiry and revocation are checked on every request.

**Blast Radius**

- A token resolves exactly one request.
- It has no claims, scope, or signature and cannot become an owner session.
- Deleting the request removes the token's only lookup row.

**No CSRF Token in the Portal**

- The token is in the path and cannot be read cross-origin.
- CORS is closed and portal writes are POST-only.
- Owner-side session writes use CSRF protection.

**Rate Limiting**

- Portal reads: 60/min per IP.
- Rate limiting bounds enumeration and abuse; token security comes from 256-bit entropy.
- No per-link counter or lockout is needed.
- Counters are database-backed and shared across instances.
- Upload limits belong to client-portal.md.

**Configuration**

- Links are built from app url, never the request host.
- Validation requires no signing secret because tokens are verified by hash lookup.

### Core Components

**MagicLinkGuard** — The only path from a token to a request.

- `resolve(string $token): ?DocumentRequest` — null for unknown, expired, or revoked.
- `reason(string $token): LinkFailure` — logs/metrics only.

**TokenFactory** — Generates, hashes, and assembles links.

- `generate(): string` — 256-bit URL-safe token.
- `hash(string $token): string` — SHA-256 hex.
- `link(string $token): string` — `app url/portal/{token}`.

**LinkPolicy** — Owns expiry and liveness rules.

- `defaultTtl(): Duration` — 14 days.
- `maxTtl(): Duration` — 90 days.
- `expiryFor(?int $ttlDays): Carbon` — clamps to max.
- `isLive(DocumentRequest $r): bool` — not revoked or expired.

**LinkRedactor** — Removes token material from logs.

- `path(string $path): string` — redacts `/portal/{token}`.
- `body(string $body): string` — redacts token fields and links.
- `header(string $name, string $value): string` — redacts link-bearing headers.

**LinkRedactorMiddleware** — Applies redaction before logging.

- `handle(Request $r, Closure $next): Response` — redacts the token path.
- `scrub(string $line): string` — applies the same rules to logs and exceptions.

**LinkMetrics** — Records outcomes without token material.

- `hit(string $outcome): void` — resolved, unknown, expired, or revoked.
- `observe(float $ms): void` — records resolution time.

## Trade-offs

**Hashed Token, Not Signed Token**

- Benefit: no signing secret, rotation; lookup is one indexed equality.
- Cost: every request requires a database read.
- Signed tokens avoid the read but cannot be revoked before expiry.

**Hash, Not Encryption**

- Benefit: the server cannot reproduce a link; a database leak yields no usable token.
- Cost: the owner cannot retrieve the link again.
- Accepted because the product shows the link once.

**Absolute Expiry**

- Benefit: leaked links have a fixed lifetime with no timer job or sliding window.
- Cost: clients returning after expiry need a new request.
- Extending expiry remains an open question.

**Path, Not Query or Fragment**

- Benefit: the path is consistently handled by proxies, frameworks, and logs.
- Query parameters may be stripped; fragments never reach the server.
- Cost: paths are commonly logged, so token redaction is mandatory.

**No Client Identity**

- Benefit: no account or password is required.
- Cost: whoever holds the link has access; forwarding, mis-pasting, and screenshots are the owner's responsibility.
- Accepted for a simple file handoff; mitigated by expiry and revocation.

**Multi-Use Token**

- Benefit: clients can leave and return without losing progress.
- Cost: a leaked link remains usable until expiry or revocation.
- Single-use would force the upload into one sitting.

**Redaction in Two Places**

- Benefit: middleware covers normal requests; the formatter covers other log paths.
- Cost: two rules must stay consistent.
- One rule alone could leak the token through exceptions or proxy logs.

**No Open Tracking**

- Benefit: opening a link notifies nobody and sends nothing to third parties.
- Cost: the owner cannot see whether the client opened it.
- Rejected tracking beacons because they would expose the URL externally.

## Security

**Entropy and Storage**

- 256-bit CSPRNG token, stored only as a hash.
- Database leaks expose no working link.
- Unique index gives direct token lookup.

**Non-Disclosure**

- All invalid links return the same 410 invalid_link response.
- Internal failure reasons never reach the client.
- Revocation returns 200 without revealing prior validity.

**Log Hygiene**

- Portal tokens are redacted before logging.
- Tokens never appear in logs, metrics, or errors.
- Tests verify tokens are absent from captured logs.

**Browser and Third-Party Exposure**

- no-referrer and strict CSP are mandatory.
- No analytics, trackers, or third-party assets.
- CSP blocks inline scripts and external sources.
- Chat apps may still fetch pasted links.

**Transport**

- HTTPS and HSTS prevent plaintext token exposure.
- Intercepted tokens require revocation to invalidate.

**Blast Radius**

- Each token resolves to exactly one request.
- Deleting the request removes its token lookup.
- Tokens cannot become users or other credentials.
- No portal list endpoint allows enumeration.

**Brute Force**

- 256-bit tokens make guessing impractical.
- 60/minute reads limit abuse without per-link state.
- Uniform failures prevent response-based enumeration.
- Malformed tokens require no database query.

**Incident Response**

- Revocation immediately ends access.
- Every request rechecks revocation in the database.
- No cache leaves a post-revocation access window.

## Performance

- **Lookup** — one indexed equality on CHAR(64), with no validation join.
- **No cache** — revocation is always read fresh.
- **Early reject** — malformed tokens never reach the database.
- **No sweep** — expired rows are pruned opportunistically.
- **No crypto** — no signature verification per request.
- **Cost** — one database read per request for exact revocation.

## Error Handling

| Status | Code             | Cause                                                    |
| ------ | ---------------- | -------------------------------------------------------- |
| `200`  | `ok`             | The link is live.                                        |
| `410`  | `invalid_link`   | Token unknown, malformed, expired, revoked, or tampered. |
| `429`  | `rate_limited`   | Bucket exhausted; includes Retry-After.                  |
| `500`  | `internal_error` | Unexpected failure, with a correlation id.               |

> Upload and item errors, such as 409, 413, and 415, are listed in client-portal.md.

**Uniform Failure**

- All five dead-link cases share one status, one code, and one message.
- That is what lets the UI ship a single dead-link screen with nothing to disambiguate.
- The internal reason is counted and logged, never returned.

**Boundaries**

- A token is live at expires_at - 1s and 410 one second later.
- A token revoked before its expiry is 410 immediately, not at the expiry moment.
- A well-formed token absent from the index is 410, not 500.
- A database failure during lookup is 500 and never authenticates the caller.
- Pruning an expired row is best-effort and must not turn a clean 410 into a 500.

## Testing

**Unit Tests**

- generate() returns 43 URL-safe characters and differs across 10,000 calls.
- hash() matches a known SHA-256 vector and is stable for the same token.
- A token contains no request id, no timestamp, no padding, and no separator.
- expiryFor() defaults to 14 days and clamps both 90 and 365 to 90.
- isLive() is true at expires_at - 1s and false one second later.
- isLive() is false whenever revoked_at is set, whatever the expiry says.
- Malformed input, empty or wrong charset or wrong length, is rejected without a query.
- The redactor leaves the method and the route pattern intact.

**Feature Tests**

- Invalid token types return byte-identical 410 bodies.
- Malformed tokens trigger no database query.
- Live tokens return 200 and resolve one request.
- Tokens never appear in any response body.
- Revoke returns 200; repeated revoke also returns 200.
- Revoked links return 410; owners still access the request.
- Deleted requests make their links return 410.
- The same link works twice from separate browsers.
- Portal logs contain no token characters.
- Portal responses set no-referrer and strict CSP.
- Portal responses never set cookies.
- Metrics distinguish failure reasons; responses do not.
- Rate limits hold across multiple app instances.

**End-to-End Tests**

- Create request, copy link, open in fresh browser, upload one file.
- Revoke link, reopen URL, confirm 410 from API and dead-link screen.
- Expired link returns 410; token unchanged.
- Token appears only in URL; nowhere in storage, cookies, or local storage.
- Link pasted into chat produces no rendered preview or metadata request.

## Open Questions

**Reissuing a Lost Link**

- The owner can lose the only copy, leaving no entry point.
- Today, the answer is a new request.
- Open: allow the owner to replace the token?
- Option: Create a new request.
- Option: Rotate the token and invalidate the old link.

**Extending Expiry**

- 14 days is a product guess for slow clients.
- Open: allow the owner to extend an unexpired link?
- Option: Keep expiry fixed.
- Option: Extend expiry and record the change.

**Unfurl and Crawler Exposure**

- Chat apps may fetch pasted links through their servers.
- Open: reject obvious crawlers before token lookup?
- Option: Process all requests normally.
- Option: Reject non-browser clients without database access.

**Opening Notification**

- The owner cannot tell whether the client opened the link.
- Open: add an opening notification?
- Option: Keep opens private.
- Option: Track opens with a first-party beacon.

**Per-Item Codes**

- One token grants access to the whole request.
- Open: support separate codes for sensitive items?
- Option: Keep one request-level token.
- Option: Add optional per-item credentials.

**One Token, Several Requests**

- Each token currently resolves to one request.
- Open: allow one token to access several requests?
- Option: Keep one token per request.
- Option: Add a client-level access record.

**Clock Skew**

- Expiry depends on synchronized application clocks.
- Open: tolerate small clock differences?
- Option: Require synchronized clocks.
- Option: Allow a small expiry grace period.
