# User Account — Technical Design

Sendocs provides one authenticated Account page for owners to manage their profile. The recommended approach is to keep profile data on the Sendocs user record, independent of the authentication provider, and store avatars in private object storage.

## Purpose

Owners need a simple place to view and maintain their account identity. A consistent profile across email/password and Google sign-in avoids tying account information to a specific login provider.

## Scope

### In Scope

- View the signed-in owner's display name, login email, and avatar.
- Update the display name.
- Upload, replace, and remove one profile avatar.
- Use the same profile for email/password and Google sign-in accounts.
- Provide an initials fallback when no avatar is set.
- Keep profile and future account controls within one Account page.

### Out of Scope

- Changing the login email address.
- Linking, unlinking, or managing authentication providers.
- Importing or synchronizing provider-hosted profile images.
- Notification preferences and other account preferences for the initial release.
- Public profiles or publicly accessible avatar URLs.

## Data Design

The profile belongs to the Sendocs user, not an authentication identity. Email/password and Google sign-in accounts use the same profile fields and avatar storage. No separate avatar table is required because each user has at most one current avatar.

**`users` — additional columns**

| Column | Type | Key / Constraint | Purpose |
| --- | --- | --- | --- |
| `avatar_key` | `VARCHAR` | `NULL` | Random key for the private stored avatar. |
| `avatar_mime_type` | `VARCHAR(100)` | `NULL` | Server-detected image type used when serving the avatar. |
| `avatar_updated_at` | `TIMESTAMPTZ` | `NULL` | Time of the last successful avatar change. |

**Indexes:** No additional index — avatar fields are read through the existing user lookup by primary key.

**Relationships:** `users` → private object storage — one optional avatar object per user. The database stores the private storage key and metadata, never image bytes or a public URL.

## API Design

All endpoints are under `/api/v1`. Owner endpoints require the session cookie. State-changing endpoints also require `X-CSRF-Token`.

### Current Profile

**GET /api/v1/auth/session** — Return the signed-in owner's session and profile.

- **Payload:** No request body.
- **Response:** Existing session response with `user.avatarUrl`; same-origin authenticated avatar endpoint URL or `null`.
- **Success:** `200`
- **Failure:** `401` — no valid owner session.

### Update Display Name

**PATCH /api/v1/account** — Update the signed-in owner's display name.

- **Payload:** `{ "name": "Display name" }`; trimmed, non-empty, maximum 120 characters.
- **Response:** Updated `User` profile.
- **Success:** `200`
- **Failure:** `401` — unauthenticated; `403` — CSRF validation failed; `422` — invalid name; `429` — rate limit exceeded.

The login email is read-only and is not accepted by this endpoint.

### Upload or Replace Avatar

**POST /api/v1/account/avatar** — Upload or replace the owner's avatar.

- **Payload:** Multipart field `avatar`; JPEG, PNG, or WebP; maximum 2 MB.
- **Response:** Updated `User` profile with the avatar URL.
- **Success:** `200`
- **Failure:** `401` — unauthenticated; `403` — CSRF validation failed; `413` — upload exceeds 2 MB; `415` — unsupported or mismatched image type; `422` — invalid image; `429` — rate limit exceeded.

The server detects the image type from file bytes, requires the detected type to match the filename extension, rejects SVG, and rejects images with either dimension above 4,096 pixels or more than 16 megapixels total. The original filename is never used as a storage key.

### Serve Avatar

**GET /api/v1/account/avatar** — Stream the signed-in owner's private avatar.

- **Payload:** No request body.
- **Response:** Image bytes with the server-detected Content-Type.
- **Success:** `200`
- **Failure:** `401` — unauthenticated; `404` — no avatar exists; `429` — rate limit exceeded.

### Remove Avatar

**DELETE /api/v1/account/avatar** — Remove the signed-in owner's avatar.

- **Payload:** No request body; requires session cookie and CSRF token.
- **Response:** Empty response.
- **Success:** `204`
- **Failure:** `401` — unauthenticated; `403` — CSRF validation failed; `429` — rate limit exceeded.

Removing an avatar restores the generated initials fallback.

## Low-Level Design

Avatar replacement and deletion involve both database metadata and object storage, which cannot participate in one atomic transaction. Use the existing storage-deletion outbox to make cleanup retryable.

### Core Components

**Account Profile Service** — Validates profile updates and coordinates avatar metadata changes.

- Update only the authenticated owner's profile.
- Validate and persist the display name.
- Coordinate avatar upload, replacement, and removal.

**Private Avatar Storage** — Stores and streams validated avatar objects using the existing private S3-compatible storage.

- Generate a random, non-user-controlled storage key.
- Store the new object before updating the user's avatar metadata.
- Stream an avatar only after checking the authenticated owner.

**Storage Deletion Outbox** — Reliably schedules obsolete or orphaned avatar objects for cleanup.

- Enqueue the previous object after a successful replacement.
- Enqueue a newly uploaded object if metadata persistence fails.
- Enqueue the current object when the avatar is removed.

## Trade-offs

- **Private authenticated avatar endpoint** — Keeps avatars private and avoids permanent public URLs, at the cost of serving image requests through the application.
- **One avatar field set on `users`** — Keeps the model simple for one avatar per user, at the cost of requiring a separate table if avatar history or multiple images are introduced.
- **No provider avatar synchronization** — Keeps the profile consistent and user-controlled, at the cost of not automatically using a Google profile image.
- **Alternative considered: public object URLs** — Rejected because account avatars should not be publicly accessible by default.

## Security

- Only the authenticated owner can read or change their own profile and avatar.
- Owner data is scoped to the authenticated user; another user's profile or avatar must never be exposed.
- Require session authentication for all endpoints and CSRF validation for state-changing endpoints.
- Keep avatar objects in private storage; do not expose public URLs or storage keys.
- Do not trust multipart Content-Type or the original filename. Detect the image type from bytes and decode the image before storage.
- Accept JPEG, PNG, and WebP only. Reject SVG and malformed images.
- Enforce the 2 MB request limit before buffering the complete upload; reject dimensions above 4,096 pixels or 16 megapixels total.
- Do not fetch or synchronize provider-hosted avatars.
- Send `X-Content-Type-Options: nosniff` and private cache controls when serving avatar bytes.
- Do not log image bytes, storage keys, or uploaded file contents.

## Error Handling

- `401 unauthenticated` — Reject requests without a valid owner session.
- `403 csrf_failed` — Reject state-changing requests with an invalid or missing CSRF token.
- `404 avatar_not_found` — Return when the authenticated owner has no avatar.
- `413 avatar_too_large` — Reject uploads larger than 2 MB.
- `415 unsupported_avatar_type` — Reject unsupported formats or a mismatch between detected content and filename extension.
- `422 validation_failed` — Reject blank or overlong display names and malformed or undecodable images.
- `429 rate_limited` — Reject requests exceeding the configured endpoint rate limit.

If avatar metadata persistence fails after an object is stored, enqueue the new object for cleanup. If old-object deletion fails, retain the outbox entry for retry; do not invalidate the newly saved avatar.

## Testing

**Unit Tests**

- Validate display-name trimming, required value, and 120-character maximum.
- Detect supported image formats from bytes and reject mismatched extensions.
- Reject malformed images, SVG, images over 2 MB, dimensions over 4,096 pixels, and images over 16 megapixels.

**Feature Tests**

- The session response returns `avatarUrl: null` when no avatar exists and the authenticated endpoint URL when one exists.
- An owner can update their own display name; blank and overlong names return `422`.
- Profile updates cannot change the login email or another user's profile.
- An owner can upload, replace, retrieve, and remove their avatar.
- An unauthenticated caller cannot read or mutate a profile or avatar.
- A user's avatar cannot be read by another account.
- A failed replacement leaves the previous avatar available.
- A failed metadata write queues the new object for cleanup.
- A successful replacement and avatar removal queue obsolete objects for cleanup.
- Removing an avatar restores the initials fallback.
- Account deletion queues the avatar object for cleanup.

## Open Questions

- Which image-processing library should decode and normalize uploaded images?
- Should Sendocs generate a fixed-size thumbnail or serve the validated original dimensions?
