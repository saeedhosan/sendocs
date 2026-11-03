# User Account - Technical Design

This document defines the owner-facing account profile and the account page. Authentication, authorization, password management, email verification, and account deletion rules remain owned by [auth-and-access.md](./auth-and-access.md).

## Scope

### In Scope

- An authenticated owner can view their account profile.
- An owner can update their display name.
- An owner can upload, replace, and remove one profile avatar.
- The account profile works the same for email/password and Google sign-in accounts.
- The owner has one Account page, starting with a Profile section.

### Out of Scope

- Changing the login email address.
- Linking, unlinking, or managing authentication providers.
- Importing or synchronizing profile images from Google or another provider.
- Notification preferences and other account preferences.
- Teams, public profiles, or publicly accessible avatar URLs.

Future account controls can be added to this document and the same Account page. Do not create a separate profile or settings feature/page unless the product grows enough to justify it.

## UX and UI

### Route

- `/account` - view and edit the signed-in owner's profile.

The page initially contains:
- **Profile:** display name, login email, and avatar.
- **Avatar actions:** upload, replace, and remove.
- **Account controls:** existing password and account-deletion flows remain defined by [auth-and-access.md](./auth-and-access.md). They can be brought into this page later without changing ownership of their security rules.

The login email is displayed but is not editable here. Email changes affect authentication and verification, so they require a separately specified flow in auth-and-access.md before being offered.

### Avatar States

- No avatar: show a generated initials fallback based on the display name.
- Avatar uploaded: show the owner's uploaded image.
- Uploading or replacing: show progress and keep the current avatar until the replacement succeeds.
- Removing: return to the initials fallback after the delete succeeds.
- Failed upload or removal: keep the last successfully saved avatar and show an actionable error.

## Data Design

The avatar belongs to the Sendocs user, not an authentication identity. Email/password and Google sign-in accounts use the same profile fields and avatar storage.

Add nullable fields to `users`:

| Column | Type | Purpose |
| --- | --- | --- |
| `avatar_key` | `VARCHAR`, nullable | Random key for the private stored avatar. |
| `avatar_mime_type` | `VARCHAR(100)`, nullable | Server-detected image type used when serving the avatar. |
| `avatar_updated_at` | `TIMESTAMPTZ`, nullable | Last successful avatar change. |

No separate avatar table is needed: each user can have at most one current avatar.

The database stores only the private storage key and metadata, never the image bytes or a public URL. The object is stored in the existing private S3-compatible storage.

## API Design

All endpoints below are under `/api/v1`. Owner endpoints require the session cookie. State-changing endpoints also require `X-CSRF-Token`.

### Current Profile

The existing `GET /api/v1/auth/session` response includes `user.avatarUrl`, which is either a same-origin URL for the authenticated avatar endpoint or `null`. This keeps the initial profile data in the existing session bootstrap response.

### Update Display Name

**PATCH /api/v1/account**

- Payload: `name` (trimmed, non-empty, maximum 120 characters).
- Response: `200` - updated `User`.
- Failures: `401` unauthenticated, `403` CSRF failed, `422` validation failed, `429` rate limited.

The email address is not accepted by this endpoint.

### Upload or Replace Avatar

**POST /api/v1/account/avatar**

- Payload: multipart field `avatar`.
- Accepted formats: JPEG, PNG, and WebP.
- Maximum size: 2 MB.
- Response: `200` - updated `User`.
- Failures: `401` unauthenticated, `403` CSRF failed, `413` too large, `415` unsupported or mismatched type, `422` invalid image, `429` rate limited.

The server determines the image type from the file bytes, not the request Content-Type. The detected type must match the filename extension. SVG is not accepted. The server must decode the image and enforce a bounded decoded image size before storing it. The original filename is not used as a storage key.

### Serve Avatar

**GET /api/v1/account/avatar**

- Requires the owner's session cookie.
- Response: image bytes with the server-detected Content-Type.
- Failure: `401` unauthenticated, `404` when no avatar exists, `429` rate limited.

The endpoint streams the image from private storage after checking the authenticated owner. It does not redirect to a public URL or expose the storage key. Send `X-Content-Type-Options: nosniff` and private cache controls.

### Remove Avatar

**DELETE /api/v1/account/avatar**

- Requires the owner's session cookie and CSRF token.
- Response: `204` - avatar metadata removed.
- Failures: `401` unauthenticated, `403` CSRF failed, `429` rate limited.

Removing an avatar restores the initials fallback.

## Storage and Failure Handling

- Generate a random, non-user-controlled storage key.
- Keep the avatar in the existing private S3-compatible bucket.
- On replacement, store the new object first, then atomically update the user's avatar metadata and enqueue the previous key for deletion through the existing storage-deletion outbox.
- If metadata persistence fails, enqueue the newly stored object for cleanup.
- On removal, clear the avatar metadata and enqueue the old key for deletion in the same database transaction.
- Storage cleanup is asynchronous and retryable; a temporary storage failure must not leave the user pointing at a missing avatar.
- Account deletion uses the existing account deletion and storage-cleanup rules in auth-and-access.md.

## Security and Privacy

- Only an authenticated owner can read or change their own avatar.
- Never expose avatar objects through a public bucket or permanent public URL.
- Do not trust the multipart Content-Type or the original filename.
- Reject SVG and any file that cannot be decoded as an accepted raster image.
- Enforce the 2 MB upload limit before buffering the complete body.
- Do not fetch or synchronize provider-hosted avatars. A user-uploaded avatar is controlled by Sendocs and remains unchanged when the owner signs in through a provider.
- Do not log image bytes, storage keys, or uploaded file contents.

## Testing

- The session response includes `avatarUrl: null` for an owner without an avatar.
- The session response includes the authenticated avatar endpoint URL after upload.
- Owners can update their own display name; blank and overlong names return `422`.
- An update cannot change the email address or another user's profile.
- JPEG, PNG, and WebP uploads succeed within the size and decoded-dimension limits.
- Oversized, unsupported, mismatched, malformed, and SVG uploads are rejected.
- A failed replacement leaves the previous avatar available.
- The old object is queued for deletion after a successful replacement.
- A failed metadata write queues the new object for cleanup.
- An owner without an avatar receives `404` from the avatar endpoint.
- An unauthenticated caller cannot read or mutate an avatar.
- A user's avatar is not visible to another account.
- Removing an avatar clears the profile URL and restores the initials fallback.
- Account deletion queues the avatar object for cleanup.

## Open Questions

- Which image-processing library should decode and normalize uploaded images in the implementation?
- Should the server generate a fixed-size thumbnail, or serve the validated original dimensions?
