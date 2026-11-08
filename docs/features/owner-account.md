# User Account — Technical Design

Authenticated users get one Account page to view and update their application-owned display name.

## Scope

### In Scope

- Logged-in users can view their profile: name, email, and avatar.
- Users can update their display name, except email address.
- OAuth (Google) users may see the picture URL returned by the provider.
- Users without a usable provider picture get a generated avatar using the first character of their display name.
- Account settings navigation is grouped in a card alongside the profile card.

### Out of Scope

- Changing the login email address.
- Uploading, replacing, or removing custom profile pictures.
- Saving profile picture data, files, or provider picture URLs in storage.
- Importing, caching, proxying, or synchronizing provider-hosted profile images.
- Linking, unlinking, or managing authentication providers.
- Notifications and other account preferences.

## API Design

### Account

**`GET /api/v1/auth/session`** — Return the authenticated user's profile and session.

- **Payload:** None; authenticated session cookie.
- **Response:** `200 OK` — Existing session response with `user.pictureUrl` or nullable.
- **Failure:** `401 Unauthorized` — Missing or invalid session.

**`PATCH /api/v1/account`** — Update the authenticated user's application display name.

- **Payload:** `{ "name": "Updated Name" }`; session cookie and CSRF token.
- **Response:** `200 OK` — Updated user profile with the existing session response shape.
- **Failure:** `401 Unauthorized` — Missing or invalid session.
- **Failure:** `403 Forbidden` — CSRF validation failed.
- **Failure:** `422 Unprocessable Entity` — Invalid display name.
- **Failure:** `429 Too Many Requests` — Rate limit exceeded (30/per minute).

## Low-Level Design

**Provider picture handling**

- Read the optional `picture` claim only after verifying oauth provider.
- Return the URL only in the successful OAuth Provider callback response.
- Never store the URL in PostgreSQL, session storage, object storage, or logs.

**Display name update**

- Authenticate the request using the existing owner session.
- Do not update the OAuth provider's name or credentials.

### Core Components

**AccountController** — Handles authenticated account profile updates.

- `update(UpdateAccountRequest $request): Response`

**AccountService** — Updates the authenticated user's application profile.

- `update(User $user, UserData $data): User`

**UserData** — Carries validated application profile data.

- `name: string`

**GenerateAvatar** — Frontend fallback avatar behavior.

- `getInitials(string $name): string` — Returns the first character of the first word, uppercased (or `?` for an empty name).
- `getBackgroundColor(string $name): string`

## Security

- All account endpoints require an authenticated session and updates require CSRF protection.
- Users can only update their own profile and validate display names on the server.
- Ignore unrecognized fields, including client-supplied picture URLs.
- Never expose OAuth access tokens, refresh tokens, or provider credentials.
- Only expose a picture URL from oauth provider profile picture url.

## Testing

**Unit tests**

- Generate a single-character avatar from single-word and multi-word names.
- Generate deterministic avatar background colors.
- Resolve provider picture URLs when available.
- Return null when no provider picture exists.
- Reject unsupported or insecure picture URL schemes.

**Feature tests**

- Authenticated user can retrieve their account information.
- Authenticated user can update their display name.
- Updating the display name does not modify OAuth provider identity data.
- Users cannot update another user's profile.
- Invalid display names return validation errors.
- CSRF protection and rate limits are enforced.

**Integration tests**

- OAuth user receives their available provider picture URL.
- OAuth user without a provider picture receives null.
- Frontend displays a single-character avatar when the picture URL is unavailable.
- Frontend falls back to a single-character avatar when the provider image fails to load.
- Updating the display name refreshes the displayed name and generated avatar.
