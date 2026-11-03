# User Account — Technical Design

Authenticated Account page for owners to manage their profile, keeping profile data on the user record and avatars in private object storage.

> References: auth-and-access.md (session, CSRF), document-requests.md (avatar upload/download endpoints).

### In Scope

- Logged in user can view profile: name, email, picture.
- User can update the disaply name and oauth provdered name.
- User can upload, replace, and remove one profile avatar.
- Use the same profile for custom and Oauth auth account.
- User get an initials fallback when no avatar is set.
- Keep profile and future account controls within account.

### Out of Scope

- Changing the login email address.
- Linking, unlinking, or managing authentication providers.
- Importing or synchronizing provider-hosted profile images.
- Notification and other account preferences.

## UX and UI

**Routes**

- `/account`, view and edit profile.

**User Flow**

```text
Owner
  |
Account page loaded
  |
Update display name or upload avatar
  |
Changes saved, avatar streamed or initials shown
  |
Remove avatar, initials fallback displayed
```

**Foundation Screens**

- Profile view, with name, email, and avatar initials.
- Avatar editor, with upload zone and preview.
- Initials fallback when no avatar is set.
- Linked sections: Changes password, Delete account

## Data Design

The profile belongs to the existing users table; no need new table.

**`users` — additional columns**

| Column              | Type           | Key / Constraint | Purpose                                    |
| ------------------- | -------------- | ---------------- | ------------------------------------------ |
| `avatar_key`        | `VARCHAR`      | `NULL`           | Random key for the private stored avatar.  |
| `avatar_mime_type`  | `VARCHAR(100)` | `NULL`           | Server-detected image type .               |
| `avatar_updated_at` | `TIMESTAMPTZ`  | `NULL`           | Time of the last successful avatar change. |

## API Design

State-changing endpoints also require `X-CSRF-Token`.

### Session

Existing response: auth-and-access.md with new filed `user.avatarUrl` or null

### Account

**PATCH /api/v1/account** - Update user display name.

- **Payload:** `name`
- **Response:** `201` - user, CSRF token, session cookie set
- **Failure:** `409` - email already registered
- **Failure:** `422` - validation failed, with per-field `details`
- **Failure:** `429` - rate limited

**POST /api/v1/account/avatar** — Upload or replace the owner's avatar.

- **Payload:** `avatar` - Multipart field; JPEG, PNG, or WebP; maximum 2 MB
- **Response:** `204` - no content
- **Failure:** `403` - CSRF check failed
- **Failure:** `429` - rate limited

**GET /api/v1/account/avatar** — Stream the private avatar.

- **Payload:** No request body.
- **Response:** Image bytes with the server-detected Content-Type.
- **Success:** `200`
- **Failure:** `403` - CSRF check failed
- **Failure:** `429` - rate limited

**DELETE /api/v1/account/avatar** — Remove the user avatar.

- **Payload:** No request body; requires session cookie and CSRF token.
- **Response:** `204` - Empty response.
- **Failure:** `403` - CSRF check failed
- **Failure:** `429` - rate limited

## Low-Level Design

Avatar replacement and deletion involve both database metadata and object storage, which cannot participate in one atomic transaction.
Use the existing storage-deletion outbox to make cleanup retryable.

### Core Components

**Account Profile Service** — Validates profile updates and avatar metadata changes.

- Update only the authenticated owner's profile.
- Validate and persist the display name.
- Coordinate avatar upload, replacement, and removal.

**Private Avatar Storage** — Streams validated avatars via existing private S3 storage.

- Generate a random, non-user-controlled storage key.
- Store the new object before updating the user's avatar metadata.
- Stream an avatar only after checking the authenticated owner.

**Storage Deletion Outbox** — Schedules obsolete avatars for cleanup.

- Enqueue the previous object after a successful replacement.
- Enqueue a newly uploaded object if metadata persistence fails.
- Enqueue the current object when the avatar is removed.

## Trade-offs

**Private Authenticated Avatar Endpoint**

- Benefit: Keeps avatars private and avoids permanent public URLs.
- Cost: Serves image requests through the application.

**No Provider Avatar Synchronization**

- Benefit: Keeps the profile consistent and user-controlled.
- Cost: Does not automatically use a Google profile image.

**Alternative Considered: Public Object URLs**

- Rejected because account avatars should not be publicly accessible by default.

## Security

- Only the authenticated owner can read or change their own profile and avatar.
- Owner data scoped to authenticated user; never expose another's profile or avatar.
- Session auth for all; CSRF for state-changing endpoints.
- Keep avatar objects in private storage; no public URLs or keys.
- Do not trust multipart Content-Type; detect image type from bytes.
- Accept JPEG, PNG, and WebP only. Reject SVG and malformed images.
- Enforce 2 MB limit; reject dimensions over 4,096 pixels or 16MP.
- Do not fetch or synchronize provider-hosted avatars.
- Send `X-Content-Type-Options: nosniff` and private cache controls.
- Do not log image bytes, storage keys, or uploaded file contents.

## Error Handling

- `401 unauthenticated` — Reject requests without a valid owner session.
- `403 csrf_failed` — Reject state-changing requests with an invalid or missing CSRF token.
- `404 avatar_not_found` — Return when the authenticated owner has no avatar.
- `413 avatar_too_large` — Reject uploads larger than 2 MB.
- `415 unsupported_avatar_type` — Reject unsupported formats or content/extension mismatch.
- `422 validation_failed` — Reject blank/overlong names and malformed images.
- `429 rate_limited` — Reject requests exceeding the configured endpoint rate limit.

## Testing

**Unit Tests**

- Validate display-name trimming, required value, and 120-character maximum.
- Detect supported image formats from bytes and reject mismatched extensions.
- Reject malformed images, SVG, and unsupported file types or contents.
- images over 2 MB, dimensions over 4,096 pixels, and images over 16 megapixels.

**Feature Tests**

- Owner can update display name; blank and overlong return `422`.
- Profile updates cannot change the login email or another user's profile.
- An owner can upload, replace, retrieve, and remove their avatar.
- An unauthenticated caller cannot read or mutate a profile or avatar.
- A user's avatar cannot be read by another account.
- Removing an avatar restores the initials fallback.
- Account deletion queues the avatar object for cleanup.

**E2E Tests**

- Owner signs in and updates display name.
- Owner removes avatar, initials fallback is restored.
- Unauthenticated user cannot access the Account page.
- Owner uploads a valid avatar image and it appears on profile.
- Owner's avatar is not readable by another account.
- Failed avatar replacement leaves previous avatar available.

## Open Questions

- Which image-processing library should decode and normalize uploaded images?
- Should the system generate a fixed-size or serve the validated original dimensions?
