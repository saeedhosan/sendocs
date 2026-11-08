# User Account — Technical Design

Authenticated users get one Account page to view and update their application-owned display name and login email. A Google profile picture may be displayed directly from the verified OAuth response when available; Sendocs never stores profile-image data or provider picture URLs.

## Scope

### In Scope

- Logged-in users can view their profile: name, email, and avatar.
- Users can update their display name, including users with an OAuth account.
- Google users may see the picture URL returned by Google's verified ID token during sign-in.
- Users without a usable provider picture get a generated initials avatar.
- Keep profile information and future account controls within one Account page.

### Out of Scope

- Changing the login email address.
- Uploading, replacing, or removing custom profile pictures.
- Saving profile picture data, files, or provider picture URLs in application storage.
- Importing, caching, proxying, or synchronizing provider-hosted profile images.
- Linking, unlinking, or managing authentication providers.
- Notifications and other account preferences.

## UX and UI

**User Flow**

1. User opens the Account page.
2. Frontend retrieves the authenticated user's profile.
3. User sees their display name, login email, and avatar.
4. If a Google picture URL is available in the current in-memory OAuth result, the frontend displays it.
5. Otherwise, the frontend generates an initials avatar.
6. User edits their display name and saves the change.
7. Frontend displays the updated name and refreshes the initials if necessary.
8. After a page refresh or a later session restoration, no provider picture URL is available; the frontend displays the initials avatar until the user signs in with Google again.

**Foundation Screens**

- Account: Profile overview containing display name, login email, and avatar.
- Edit Display Name: Inline editing or a small form within the Account page.

## API Design

### Account

**`GET /api/v1/auth/session`** — Return the authenticated user's profile and session.

- **Payload:** None; authenticated session cookie.
- **Response:** `200 OK` — Existing session response with `user.pictureUrl`; always `null` because provider picture URLs are not persisted.
- **Failure:** `401 Unauthorized` — Missing or invalid session.

**`PATCH /api/v1/account`** — Update the authenticated user's application display name.

- **Payload:** `{ "name": "Updated Display Name" }`; session cookie and CSRF token.
- **Response:** `200 OK` — Updated user profile with the existing session response shape.
- **Failure:** `401 Unauthorized` — Missing or invalid session.
- **Failure:** `403 Forbidden` — CSRF validation failed.
- **Failure:** `422 Unprocessable Entity` — Invalid display name.
- **Failure:** `429 Too Many Requests` — Rate limit exceeded (30 requests per minute per owner).

**`GET /api/v1/auth/oauth/google/callback`** — The successful callback response includes `user.pictureUrl` from the verified Google ID token when it is a valid HTTPS URL hosted on `googleusercontent.com` or one of its subdomains. Otherwise it is `null`. This value is response-only and is never persisted. Subsequent session responses return `null`.

## Low-Level Design

**Provider picture handling**

- Read the optional `picture` claim only after verifying the Google ID token signature and claims.
- Accept only HTTPS URLs hosted on `googleusercontent.com` or its subdomains.
- Return the URL only in the successful Google OAuth callback response.
- Never store the URL in PostgreSQL, cache, session storage, object storage, or logs.
- The frontend keeps the URL in memory only and loads the image directly from Google.
- If the URL is missing, unavailable, or fails to load, the frontend displays the generated initials avatar.
- A page refresh or restored session has no picture URL; initials are the expected fallback.

**Display name update**

- Authenticate the request using the existing owner session.
- Trim and validate the submitted name.
- Update `users.name`.
- Do not update the OAuth provider's name or credentials.

### Core Components

**AccountController** — Handles authenticated account profile updates.

- `update(UpdateAccountRequest $request): Response`

**AccountService** — Updates the authenticated user's application profile.

- `update(User $user, UserData $data): User`

**UserData** — Carries validated application profile data.

- `name: string`

**GenerateAvatar** — Frontend fallback avatar behavior.

- `getInitials(string $name): string`
- `getBackgroundColor(string $name): string`

## Security

- All account endpoints require an authenticated session.
- Account updates require CSRF protection.
- Users can only update their own profile.
- Validate display names on the server.
- Ignore unrecognized fields, including client-supplied picture URLs.
- Never expose OAuth access tokens, refresh tokens, or provider credentials.
- Only expose a picture URL from a verified Google ID token, and only when it uses HTTPS and a Google-hosted image domain.
- Never persist, cache, proxy, or log provider picture URLs or image data.

## Testing

**Backend unit tests**

- Accept a valid HTTPS Google-hosted picture URL from a verified ID token.
- Return `null` for missing, insecure, or unsupported picture URLs.
- Validate display-name trimming and length.

**Backend feature tests**

- Authenticated user can update their display name.
- Updating the display name does not modify OAuth provider identity data.
- Users cannot update another user's profile.
- Invalid display names return validation errors.
- CSRF protection and per-owner rate limits are enforced.
- A successful Google callback returns its verified picture URL without persisting it.
- Subsequent session resolution returns `pictureUrl: null`.

**Frontend integration tests (frontend phase)**

- Display initials when no picture URL is available.
- Fall back to initials when the provider image fails to load.
- Keep the provider URL in memory only, not persistent browser storage.
- Updating the display name refreshes the displayed name and generated initials.
