# Auth and Access — Technical Design

This document defines how authentication and authorization work for the owner account system. It covers registration, sign-in, sessions, password management, email verification, and account deletion. It also describes the security model and data structures used to enforce owner-scoped access control.

## Scope

### In Scope

- Owner can create an account using email and password.
- Owner can login, logout and reset password password.
- Owner can signup and signin using auth provider google.
- Owner can look up their current session and logout, delete session.
- Owner can request and complete password reset when custom register.
- Owner can delete their account and everything it owns at any time.
- Owner can be authenticated and authorized to access only their own data.
- Owner can verify their email address when signup with email and password.
- The system issues secure session cookies with hashed tokens.
- The system enforces session absolute expiry and CSRF protection.
- The system applies rate limiting on auth and owner endpoints.
- Client authorizes using secure magic link in secure-magic-link.md.

### Out of Scope

- Client accounts and passwords.
- Multi-factor authentication.
- Other social login providers.
- Teams, workspaces, roles, and per-resource grants.
- API keys, service accounts, and machine-to-machine auth.
- Audit logs of authentication events.

## UX and UI

**Routes**

- `/register`, create an owner account with email and password.
- `/login`, sign in an owner with email and password or Google.
- `/auth/google`, initiate Google OAuth sign-in.
- `/auth/google/callback`, handle Google OAuth callback.
- `/forgot-password`, request a reset link.
- `/reset-password?token=`, set a new password from an emailed link.
- `/verify-email?token=`, confirm an address from an emailed link.
- `/settings/password`, change a password while signed in.
- `/settings/delete`, close an account.
- `/dashboard`, the signed-in landing page.

> The portal and every owner request screen live in document-requests.md and client-portal.md.

**User Flow**

```text
Owner
  |
Register, Sign in (Email/Password), or Sign in with Google
  |
Session (Cookie Issued)
  |
Dashboard
  |
Email Verification Offered, Not Required
  |
Sign Out -> Session Row Deleted
```

**Password Recovery Flow**

```text
Owner
  |
Forgot Password
  |
Reset Link Queued and Emailed
  |
Link Opened
  |
New Password Set
  |
Every Other Session Revoked
```

**Foundation Screens**

- Sign in
- Register
- Password recovery
- Email verification
- Account settings, for password and deletion

**Navigation Screens**

- Register, reachable from sign in
- Forgot password, reachable from sign in
- Dashboard, the post-sign-in destination
- Account settings, from the dashboard nav

**Discovery Screens**

- Wrong email or password
- Email already registered
- Reset or verification link expired or already used
- Session expired mid-task
- Signed out, reached by deep link while signed out
- Rate limited, with the wait shown
- Email not delivered, with a resend action
- Account already closed

## Data Design

**users**

| Column              | Type          | Key / Constraint   | Purpose                 |
| ------------------- | ------------- | ------------------ | ----------------------- |
| `id`                | `UUID`        | `PK`               | User identifier.        |
| `name`              | `VARCHAR 120` | `NOT NULL`         | Display name.           |
| `email`             | `VARCHAR 254` | `UNIQUE NOT NULL`  | Login identifier.       |
| `password`          | `TEXT`        | nullable           | Hash password.          |
| `provider`          | `VARCHAR 100` | `DEFAULT 'custom'` | Auth provider: google.  |
| `email_verified_at` | `TIMESTAMPTZ` | nullable           | Verification timestamp. |
| `created_at`        | `TIMESTAMPTZ` | `NOT NULL`         | Registration time.      |
| `updated_at`        | `TIMESTAMPTZ` | `NOT NULL`         | Last updated time.      |

**sessions**

| Column       | Type          | Key / Constraint  | Purpose                      |
| ------------ | ------------- | ----------------- | ---------------------------- |
| `id`         | `UUID`        | `PK`              | Session identifier.          |
| `user_id`    | `UUID`        | `FK → users.id`   | Session owner.               |
| `token_hash` | `CHAR 64`     | `UNIQUE NOT NULL` | SHA-256 of the cookie value. |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL`        | Absolute expiry              |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`        | Issued time.                 |

**account_tokens**

| Column       | Type          | Key / Constraint  | Purpose                |
| ------------ | ------------- | ----------------- | ---------------------- |
| `id`         | `UUID`        | `PK`              | Token identifier.      |
| `user_id`    | `UUID`        | `FK → users.id`   | Token owner.           |
| `purpose`    | `VARCHAR 20`  | `NOT NULL`        | The purpose name.      |
| `token_hash` | `CHAR 64`     | `UNIQUE NOT NULL` | SHA-256 token          |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL`        | Short absolute expiry. |
| `used_at`    | `TIMESTAMPTZ` | nullable          | Set on redemption      |

**auth_identities**

| Column        | Type          | Key / Constraint | Purpose              |
| ------------- | ------------- | ---------------- | -------------------- |
| `id`          | `UUID`        | `PK`             | Identity identifier. |
| `user_id`     | `UUID`        | `FK > users.id`  | The user belongs to. |
| `provider`    | `ENUM`        | `NOT NULL`       | Supported Providers. |
| `provider_id` | `VARCHAR 255` | nullable         | Provider's unique ID |
| `created_at`  | `TIMESTAMPTZ` | `NOT NULL`       | Created time.        |
| `updated_at`  | `TIMESTAMPTZ` | `NOT NULL`       | Updated time.        |

**Indexes:**

- `users (email)` unique — the only user read path
- `auth_identities (provider, provider_id)` unique — lookup for social providers
- `auth_identities (user_id)` — find all identities for a user
- `sessions (token_hash)` unique — hit on every authenticated request
- `sessions (user_id)` — revoke all other sessions
- `account_tokens (token_hash)` unique — the only token redemption lookup

**Relationships:**

- `users` **1:N** `sessions`
- `users` **1:N** `account_tokens`
- `users` **1:N** `auth_identities`

> Both cascade on delete. Magic links live on document_requests, covered by document-requests.md, and the rules that read them live in secure-magic-link.md.

## API Design

### Owner Authentication

**POST /api/v1/auth/register** — Create an owner account and sign it in.

- **Payload:** `name`, `email`, `password`
- **Response:** `201` — user, CSRF token, session cookie set
- **Failure:** `409` — email already registered
- **Failure:** `422` — validation failed, with per-field `details`
- **Failure:** `429` — rate limited (10 per minute per IP)

**POST /api/v1/auth/login** — Exchange credentials for a session cookie.

- **Payload:** `email`, `password`
- **Response:** `200` — user, CSRF token, session cookie set
- **Failure:** `401` — invalid credentials
- **Failure:** `422` — malformed email or password shape, with per-field `details`
- **Failure:** `429` — rate limited (10 per minute per IP)

**POST /api/v1/auth/logout** — Destroy the current session.

- **Payload:** none; session cookie plus CSRF header
- **Response:** `204` — no content, and the cookie is expired on the way out
- **Failure:** `401` — no valid session
- **Failure:** `403` — CSRF check failed
- **Failure:** `429` — rate limited (120 per minute per owner)

**GET /api/v1/auth/session** — Resolve the caller, used by the UI on load and refresh.

- **Payload:** none; session cookie
- **Response:** `200` — user, CSRF token, session expiry
- **Failure:** `401` — no valid session
- **Failure:** `429` — rate limited (120 per minute per owner)

### Password Reset

**POST /api/v1/auth/password/forgot** — Send a reset link to the address on file.

- **Payload:** `email`
- **Response:** `202` — accepted, identical for known and unknown addresses
- **Failure:** `422` — malformed email, with per-field `details`
- **Failure:** `429` — rate limited (5 per hour per IP)

**POST /api/v1/auth/password/reset** — Redeem a reset token and set a new password.

- **Payload:** `token`, `password`
- **Response:** `200` — user, CSRF token, session cookie set, so the owner is signed in
- **Failure:** `400` — the account has no password to reset (Google-only)
- **Failure:** `410` — token unknown, expired, or already used
- **Failure:** `422` — password fails policy
- **Failure:** `429` — rate limited (5 per hour per IP)

**POST /api/v1/auth/password/change** — Change the password while signed in.

- **Payload:** `currentPassword`, `password`
- **Response:** `204` — no content
- **Failure:** `400` — the account has no password to change (Google-only)
- **Failure:** `401` — `currentPassword` is wrong
- **Failure:** `403` — CSRF check failed
- **Failure:** `422` — password fails policy
- **Failure:** `429` — rate limited (120 per minute per owner)

### Email Verification

**GET /api/v1/auth/email/verify** — Redeem a verification token from the email link.

- **Payload:** `token` (query parameter)
- **Response:** `200` — verified address
- **Failure:** `410` — token unknown, expired, or already used
- **Failure:** `422` — the token is missing or longer than 200 characters
- **Failure:** `429` — rate limited (5 per hour per IP)

**POST /api/v1/auth/email/resend** — Send a new verification link.

- **Payload:** none; session cookie plus CSRF header
- **Response:** `202` — accepted
- **Failure:** `401` — no valid session
- **Failure:** `429` — rate limited (5 per hour per owner)

### Account Deletion

**DELETE /api/v1/auth/account** — Delete the owner account and everything it owns.

- **Payload:** `password`, `confirm` (the email, typed to confirm)
- **Response:** `204` — no content, with the session cookie expired
- **Failure:** `400` — the account has no password (Google-only)
- **Failure:** `401` — wrong password
- **Failure:** `422` — `confirm` does not match
- **Failure:** `429` — rate limited (120 per minute per owner)

> Every write above can also return 403 csrf_failed on a stale or missing
> X-CSRF-Token, so that code is listed once in the error table below rather than repeated
> per endpoint. openapi.yaml publishes it on each operation.

### Client Portal

The client credential is the magic link, and its rules belong to secure-magic-link.md.
Only the guard boundary is noted here; the endpoint itself is defined in secure-magic-link.md and client-portal.md, and neither is restated.

**GET /api/v1/portal/{token}** — Authenticate by magic link and return the portal view.

- **Payload:** none; the token is in the path
- **Response:** `200` — request title, required items with per-item state, link expiry
- **Failure:** `410` — unknown, malformed, expired, revoked, or tampered
- **Failure:** `429` — rate limited (60 per minute per IP)

> Restated here only to mark the authorization boundary. secure-magic-link.md owns the token rules and client-portal.md owns the view and the upload endpoint.

## Low-Level Design

**Credentials**

- Email is trimmed and lowercased before the uniqueness check.
- Passwords are required min 6 lenght, no composition rules.
- Plaintext is never stored.

**Registration**

- The user, session, and verification token are inserted in one transaction.
- The verification email is dispatched after commit, so it is never sent rollback.

**Google OAuth**

- Google OAuth uses Authorization Code flow with PKCE and state for CSRF protection.
- state is generated, stored, and consumed on callback, so a replayed redirect finds nothing. The PKCE verifier is stored alongside it and never appears in the authorization URL.
- Google ID token is verified using Google's public keys.
- Google emails are treated as verified if `email_verified` is true.
- First Google sign-in creates a user and an auth_identities entry and set provider.
- If an identity (provider, provider_id) exists, the user is signed in.
- If the email exists but under a different identity, linking is rejected with 409.
- Google-only accounts cannot use password reset or password change (return 400).

**Session**

- 256 bits from a CSPRNG, URL-safe base64.
- Only SHA-256(token) is stored.
- Cookie is HttpOnly, Secure in production, SameSite=Lax, Path=/, Max-Age=86400 \* 7.
- Lax blocks the cross-site POST that CSRF exists to stop.
- It still allows a deep link from an email client.
- Every sign-in creates a new session, so a second device does't logout the first.
- An expired row is deleted by the request that sees it.
- A malformed cookie is rejected without a query.
- One indexed read resolves the cookie per request, and its owner is read with it.
- No in-process cache, so nothing to invalidate.

**CSRF Token**

- The value is HMAC-SHA256(session_id, CSRF_SECRET).
- The check is Auth middleware, not the framework's CSRF middleware, which compares a Laravel session token this application does not have.
- Returned by register, login, reset, and GET /auth/session.
- The UI holds it in memory and sends X-CSRF-Token on every state-changing request.
- Binding it to the session prevents cross-session replay.
- Signing it avoids a database read and a token table.
- It is never read from a cookie, so there is nothing to inject.
- Logout is checked too; a forced logout is still an attacker-triggered change.

**Magic Link Validation**

- Covered by secure-magic-link.md; this document only depends on the outcome.
- A portal resolves one client credential from the path, with no cookie involved.
- Failure is always 410, never 401, so a client cannot tell a wrong link.

**One-Time Tokens**

- 256 bits, stored as hashes, valid for 60 minutes, marked used_at on redemption.
- Redemption is one conditional update: used_at IS NULL AND expires_at > now().
- A replay loses the race and gets 410.
- Issuing a new token for the same purpose deletes the previous one.
- A successful reset or change revokes every other session for that owner.
- forgot-password returns the same 202 for known and unknown addresses.
- It sends nothing when the address is unknown so it cannot enumerate accounts.
- Sessions carry no trust level, so unverified owner can use the product immediately.

**Account Deletion**

- Requires the password and the email typed as confirmation.
- Deleting the user cascades to sessions and tokens in one statement.
- Stored files are removed separately; a failure is retried from a cleanup job.

**Rate Limiting**

- Fixed-window counter in database, keyed by (bucket, key).
- The key embeds the window start, so a rolled window is a new row.
- Counters live in the database, so limits hold across instances.
- In memory they would multiply by the instance count.
- Unauthenticated buckets key on client IP.
- Authenticated buckets key on user_id, falling back to IP.
- Rejections return 429 with Retry-After in whole seconds.
- A failed login still runs a dummy bcrypt verification.
- So timing never reveals whether the email exists.

**Token Hygiene**

- Tokens never appear in logs or error bodies.
- Formatter redacts Cookie, Authorization, and any token field.
- Access logs drop the path segment after /api/v1/portal.
- Portal pages set Referrer-Policy: no-referrer with no third-party assets.
- Secrets come only from environment.

### Core Components

**AuthController** — Owner auth endpoints, request validation, and error mapping.

- `register(Request $r): JsonResponse`
- `login(Request $r): JsonResponse`
- `logout(Request $r): Response`
- `session(): JsonResponse`
- `forgotPassword(Request $r): JsonResponse`
- `resetPassword(Request $r): JsonResponse`
- `changePassword(Request $r): Response`
- `verifyEmail(Request $r): JsonResponse`
- `resendVerification(): JsonResponse`
- `destroy(Request $r): Response`

**SessionService** — Issue, resolve, and revoke session cookies.

- `issue(User $u): Session`
- `resolve(string $token): ?User`
- `revoke(string $token): void`
- `revokeAllExcept(User $u, string $token): void`

**PasswordService** — Hash and verify passwords, and run the dummy verify on failure.

- `hash(string $plain): string`
- `verify(string $plain, string $hash): bool`
- `dummyVerify(): void`

**AccountTokenService** — Issue and redeem single-use reset and verification tokens.

- `issue(User $u, string $purpose): string` — returns the raw token, once
- `redeem(string $token, string $purpose): ?User`
- `revokeAll(User $u, string $purpose): void`

**CsrfTokenService** — Derive and verify the session-bound CSRF token.

- `derive(string $sessionId): string`
- `verify(string $sessionId, ?string $token): bool`

**AuthenticateSession** — Middleware that resolves the caller and attach to request.

- `handle(Request $r, Closure $next): Response` — `401` when no valid session
- `requireCsrf(Request $r): void` — `403` on a mismatched token

**RateLimiter** — Fixed-window counters in the database.

- `hit(string $bucket, string $key): int`
- `tooManyAttempts(string $bucket, string $key, int $max): bool`
- `availableIn(string $bucket, string $key): int` — seconds for `Retry-After`

**AuthMailer** — Queue the three auth emails behind an interface.

- `sendWelcome(User $u): void` — dispatches a queued job
- `sendVerification(User $u): void` — dispatches a queued job
- `sendPasswordReset(User $u): void` — dispatches a queued job

**GoogleOAuthService** — Handle Google OAuth authentication.

- `generateAuthUrl(): string` — generates state-protected authorization URL
- `exchangeCode(string $code): array` — exchanges code for tokens and returns user info
- `findOrCreateUser(array $googleUser): User` — finds/creates user from Google profile

**OwnershipScope** — The single authorization rule, applied at the query.

- `forUser(User $u): Builder` — adds the `owner_id` filter to any owner-scoped query

## Authorization

**The Rule**

- One rule: every owner-scoped query filters by the session's user_id.
- The filter is in the WHERE clause, never applied after the fetch.
- A forgotten check returns nothing rather than everything.

**Where It Is Enforced**

- In the query, through OwnershipScope::forUser().
- In the route, as a named scope, so an unscoped query has to be written deliberately.
- Never in a service method, where one missed call leaks a whole table.

**What an Owner Can Reach**

- Their own requests, items, and documents.
- Their own sessions and account tokens.
- Nothing else; there is no admin role and no support role.

**Non-Disclosure**

- Another owner's resource returns 404, never 403.
- The body is identical to a nonexistent id, so existence is not revealed.
- 403 is reserved for a CSRF failure on a resource the caller does own.
- No endpoint enumerates users, emails, or token ids.

**Client Authorization**

- A portal token authenticates exactly one request and its items.
- The itemId is scoped by the request_id from the same token lookup.
- So a valid token cannot be paired with another request's item.
- A client has no identity, so there is nothing else to check.

**Session Ownership**

- A session can only be revoked by the user it belongs to.
- Sign-out and sign-out-others resolve the caller first, then scope by user_id.
- A session id from another account is treated as unknown, not forbidden.

**Unauthenticated Paths**

- health, register, login, forgot, reset, email verify, and Google OAuth endpoints.
- These cannot read owner data, so they have no caller to scope by.
- GET /auth/session is the exception: returns `401` rather than an empty user.

**What Is Not Modelled**

- No roles, permissions, or per-resource grants.
- No field-level authorization; ownership is the only dimension.
- No impersonation or support access.
- Verification status grants nothing, so it is not an authorization input.

## Trade-offs

**Database-Backed Sessions**

- Revocation and sign-out-everywhere are trivial.
- A database leak yields no usable cookie, since only hashes are stored.
- Cost: one indexed lookup per authenticated request.
- Alternative: JWTs, rejected because they cannot be revoked before expiry.

**Absolute 7-Day Expiry**

- Bounds a stolen cookie with no timer job.
- Cost: a weekly re-login for every owner.
- Alternative: sliding expiry, rejected because it writes on most requests.
- It also keeps a stolen cookie alive indefinitely.

**bcrypt**

- In the standard library of every runtime, including Laravel's default driver.
- Memory-hard rather than CPU-hard, so weaker against GPU attacks than Argon2id.
- Cost is tunable through the work factor, currently 12.
- The work factor is encoded in the stored hash, so it can be raised later.

**HMAC-Derived CSRF Token**

- No token table and no per-request read.
- Bound to the session, so it cannot be replayed elsewhere.
- Cost: server-side CSRF that cannot be rotated without invalidating outstanding tokens.
- Alternative: a random token per session, rejected for an extra row and an extra read.

**Cookie Plus CSRF Header, Not Bearer**

- An HttpOnly cookie is far harder to steal through XSS than a token in browser storage.
- Cost: CSRF protection is needed at all.
- A Bearer token is replayable from any origin, but is easier to exfiltrate.

**Database Rate-Limit Counters**

- Limits hold across instances and survive restarts.
- Cost: one small write per public request.
- Alternative: Redis, not warranted at 1 req/s.

**Queued Email**

- Password reset and verification are impossible without delivery.
- Cost: the email infrastructure and the worker process, which is covered in design.md.
- Queuing by default means a slow or failing provider never blocks a request.
- A queued job can be lost on restart, so the token is stored first & UI can resend.

**No Trust Level for Unverified Owners**

- Frictionless signup.
- Cost: throwaway accounts.
- Rate limits and owner isolation are the controls;
- Gating the product on verification would add support burden for no security gain.

## Security

**Password Storage**

- Plaintext is never stored, logged, or returned.
- bcrypt with a per-user salt, cost and parameters encoded in the hash.
- A query guard fails tests that select password outside the auth repository.

**Token Storage**

- Only hashes are persisted, for sessions and one-time tokens alike.
- A database dump yields nothing replayable as a cookie or a link.
- Redemption and session lookup are single indexed equalities.

**CSRF Token**

- Required on every state-changing owner request.
- A cross-origin caller cannot read the token; no CORS is exposed.
- A cross-origin caller cannot forge it; it is server-signed.
- SameSite=Lax is the second layer.

**Authorization**

- One rule: every owner-scoped query filters by the session user_id in the WHERE clause.
- One rule: Never filter that in code after the fetch.
- Another owner's resource returns 404, with a body identical to a nonexistent id.
- Enforcing at the query means a forgotten check returns nothing, not everything.

**Session Fixation**

- A fresh id and token are created on every login and register.
- user_id is never updated on an existing row.
- Logout deletes the row, so the old cookie is inert.

**Error Disclosure**

- Login returns one 401 invalid_credentials when a wrong password or unknown email.
- forgot-password returns one 202 for both.
- Timing is uniform, so neither response reveals which case it was.
- Stack traces and database messages never reach a response.
- 500 returns a generic message and a correlation id that maps to the server log.

**Brute Force and Abuse**

- 3 login attempts per minute per IP, database-backed covers login and oauth endpoints.
- Reset and resend are capped at 5 per hour.
- Registration is open and unverified; there is no CAPTCHA and no manual review.
- Owner isolation and file limits are the remaining controls.
- OAuth state tokens are single-use and expire to prevent replay attacks.

**Injection and Output**

- All user text is parameterized in SQL and escaped on output.
- Reset and verification tokens are compared by hash, never interpolated.

**Headers**

- HTTPS only, with HSTS.
- X-Content-Type-Options: nosniff, X-Frame-Options: DENY.
- Referrer-Policy: no-referrer on portal pages.

## Performance

- **Session lookup** — one indexed equality plus a join, so a single round trip resolves the caller.
- **Negligible at peak** — about 1 req/s, far below where this becomes a bottleneck.
- **Rate-limit write** — the only added cost on public routes: one upsert per request.
- **Rows roll off** — window keys change, so counters do not accumulate.
- **Password Hash** — the dominant CPU cost, at roughly 100–250 ms per registration, login, or reset.
- **Dummy verify** — deliberate on failed login, and bounded by the 10/minute limit.
- **Verification status** — a column on the user already joined for the session, so no extra query.
- **Pool** — auth touches the database on nearly every request, so pool saturation is the signal to watch.

## Error Handling

| Status | Code                  | Cause                                                           |
| ------ | --------------------- | --------------------------------------------------------------- |
| `401`  | `unauthenticated`     | Missing, malformed, unknown, or expired session.                |
| `401`  | `invalid_credentials` | Wrong password, on login, change, or deletion.                  |
| `403`  | `csrf_failed`         | Valid session, missing or mismatched X-CSRF-Token.              |
| `404`  | `not_found`           | Resource missing, or owned by another owner.                    |
| `409`  | `email_taken`         | Registered address or email linked to different provider.       |
| `410`  | `invalid_link`        | Portal token unknown, malformed, expired, revoked, or tampered. |
| `410`  | `invalid_token`       | Reset or verification token unknown, expired, or used.          |
| `422`  | `validation_failed`   | Field-level failure, with a details map per field.              |
| `400`  | `oauth_failed`        | invalid code, state mismatch, email not verified.               |
| `429`  | `rate_limited`        | Bucket exhausted; includes Retry-After.                         |
| `500`  | `internal_error`      | Unexpected failure, logged with a correlation id.               |

**Response Shape**

- `{ "error": { "code", "message", "details" } }` for every error.
- `message` is human-readable; `code` is stable and machine-readable.
- `details` appears only on validation failures.

**Sessions**

- A missing or expired session is always 401 unauthenticated.
- No endpoint returns 200 with a null user; the UI reads 401 as signed out.
- An expired row is deleted by the request that observes it.
- That delete is best-effort and must not turn a clean 401 into a 500.
- A database failure during lookup returns 500 and never auth the caller anyway.
- A corrupt stored hash that fails verification is an internal error, not 401.

**Email and Deletion**

- Dispatching is queued, so a provider outage never fails or delays the request.
- The token is stored before dispatch, so a lost job is recoverable by resend.
- The owner can request another link.
- Jobs retry with backoff; a permanently failed job is logged for manual follow-up.
- Resends stay within rate limits, so an outage cannot amplify traffic.
- Deletion reports success only after the commit.
- Failed object cleanup is retried and logged, not surfaced as an error.

## Testing

**Unit Tests**

- Email normalisation maps case and whitespace variants to one stored value.
- Hashing stores bcrypt, omits the plaintext, and verifies the same password.
- Password policy: 5 rejected, 6 accepted, 200 accepted, 201 rejected.
- CSRF derivation is stable per session and differs across sessions.
- A changed secret invalidates every derived token.
- Session expiry: valid at expires_at - 1s, rejected just after.
- One-time token redemption is single-use under two concurrent requests.
- Rate-limit window allows N, rejects N+1 with Retry-After, and refills after rollover.
- the owner-scope helper check a user_id filter is present rather than trusting review.

**Feature Tests**

- Register returns 201, sets the cookie, and returns no password.
- A duplicate email returns 409 with the same body both times.
- Login with a wrong password and an unknown email return byte-identical 401 bodies.
- Google OAuth: new user creates account and signs in.
- Google OAuth: existing user signs in, same email different provider returns 409.
- Logout returns 204 and the cookie is 401 afterwards.
- Changing password for Google-only account returns 400.
- Changing the password invalidates every other session.
- GET auth/session returns the user with a cookie and 401 for not found user.
- An unauthenticated owner request is 401 to any owner endpoints.
- A valid session without a CSRF token is 403.
- A CSRF token from session A is rejected on session B.
- Owner A reaching owner B's request, item, or document gets 404.
- Deleted, expired, and random session tokens yield identical 401 responses.
- forgot-password returns an identical 202 for known and unknown addresses.
- forgot-password sends nothing when the address is unknown and response 202.
- Reset with a valid token changes the password; the same token then returns `410`.
- A reset from another browser signs out existing sessions.
- Verification sets email_verified_at once, and a replayed link returns 410.
- Mail is asserted through a faked queue, never a live send.
- A failed job retries, then logs, and the owner can still resend.
- Account deletion requires the password and the matching confirmation, then cascades.
- Expired, revoked, tampered, and malformed portal links each return 410
- portal link byte-identical body, and a malformed token never reaches the database.
- A token paired with another request's itemId returns 404.
- Rate limits hold across two app instances sharing one database.
- Access logs for a portal URL contain the route pattern, not the token.
- No log line contains a session cookie value.

**End-to-End Tests**

- Register, verify email, create a request, logout, and confirm sign-in on return.
- Sign in with Google, create a request, sign out, and confirm sign-in on return.
- Two browser contexts: A cannot open B's request by URL and sees only A's requests.
- Forgot-password email, reset through the UI, then sign in with the new password.
- Revoke a link, reopen the copied URL, and confirm the error and success screen.
- Devtools confirm the session cookie is HttpOnly and unreadable from JavaScript.

## Open Questions

**Secret Rotation**

- Rotating CSRF_SECRET invalidates every outstanding token at once.
- Option: double-buffered overlap, or a coordinated sign-out.

**Session Renewal**

- A 7-day absolute expiry forces a weekly re-login for active owners.
- Option: re-issue within 24 hours of expiry, at the cost of a sliding window.

**Logout Cookie**

- The row is deleted, so the old cookie is inert either way. Sending the deletion
  in the same response only saves the browser from presenting a dead cookie.
- Open: expire it server-side, or leave it to the seven-day expiry?
- Implemented as: expired server-side, on the documented path `/`.

**Concurrent Sessions**

- Unbounded today, so a compromised account can hold many valid cookies.
- Option: cap the count, then evict the oldest or reject the newest.

**Email Enumeration**

- The 409 confirms an address is already registered.
- Open: acceptable given open signup, or return 202 instead?

**Unverified Accounts**

- Verification gates nothing today.
- Open: Can outbound or bulk email make the domain look spammy?
- Option: Gate outbound email until verification.

**A Second Verification Link**

- Resending replaces the live token, so only the newest link works.
- Redeeming a second live link keeps the first `email_verified_at` and reports it,
  because verification is documented to happen once.
- Resending to an address that is already verified still sends a link and still
  answers `202`, because verification grants nothing, so there is nothing to withhold.
- Open: should a second redemption answer `410` instead, or should resend short-circuit
  for an already verified address?

**Recovery For Google-Only Accounts**

- A Google-only owner has no password, and `POST /auth/password/reset` answers
  `400 password_not_supported` for one.
- Open: send nothing, or send a link that ends in that 400?
- Implemented as: nothing is sent and the answer stays the same `202`, because the
  response is identical either way and a dead-end link is worse than no link.

**Deletion For Google-Only Accounts**

- `DELETE /auth/account` asks for a password, so a Google-only owner cannot delete
  their own account at all. That is a worse dead end than a dead link: an owner who
  signed up with Google cannot ask for their data to go away.
- Implemented as: `400 password_not_supported`, matching the same account on change
  and reset, and published in openapi.yaml for this operation.
- Open: is that acceptable, or should deletion for a Google-only owner require only
  the address confirmation, with the session itself as proof of identity?
- Option: allow it when the session was issued by an identity provider, and keep
  requiring the password otherwise.

**Deletion Cleanup**

- Account deletion records owned document storage keys in the same transaction as account deletion.
- Stored-object cleanup is handled by the durable outbox documented in `document-requests.md`.
- Failed cleanup remains queued and is retried by the scheduler; it does not reverse account deletion.

**bcrypt Work Factor**

- Cost 12 is a placeholder, not a measured target.
- Open: calibrate against the production CPU budget.
- Option: If Argon2id becomes available, rehash on next successful login.

**OAuth Configuration**

- Store Google Client ID, Client Secret, and Redirect URI in environment variables.
- Open: which OAuth scopes are needed? Minimum: name, email, profile.
- Open: allow linking existing email/password accounts to Google later?

**OAuth Configuration**

- Store Google Client ID, Client Secret, and Redirect URI in environment variables.
- Open: which OAuth scopes are needed? Minimum: name, email, profile.
- Option: Request only the minimum required scopes for name, email and profile.
- Open: allow linking existing email/password accounts to Google later?
- Option: Keep Google and email/password accounts separate for now.

**OAuth State Lifetime**

- The state token is single-use and stored server-side with its PKCE verifier, consumed on the callback.
- It currently expires after 10 minutes, a placeholder rather than a measured value.
- Open: is 10 minutes the right window, given how long a Google consent screen takes?

**Client IP**

- The rate-limit key depends on trusted proxy configuration.
- Open: which header, and can a spoofed X-Forwarded-For reach the app?
- Option: Trust only the proxy/load balancer and use its forwarded client IP.
