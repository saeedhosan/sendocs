# User Account — Technical Design

Authenticated users get one Account page to view and update their application-owned display name, login email, and profile picture.

## Scope

### In Scope

- Logged-in users can view their profile: name, email, and picture.
- Users can update their display name, including users with an OAuth account.
- Users can use their OAuth provider's profile picture when available.
- Users without a usable provider picture get a generated initials avatar.
- Keep profile information and future account controls within one Account page.

### Out of Scope

- Changing the login email address.
- Uploading, replacing, or removing custom profile pictures.
- Saving profile picture data or files in application storage.
- Linking, unlinking, or managing authentication providers.
- Importing or synchronizing provider-hosted profile images.
- Notifications and other account preferences.

## UX and UI

**User Flow**

1. User opens the Account page.
2. Frontend retrieves the authenticated user's profile.
3. User sees their display name, email, and profile picture.
4. If an OAuth picture is available, the frontend displays it.
5. Otherwise, the frontend generates an initials avatar.
6. User edits their display name and saves the change.
7. Frontend displays the updated name and refreshes the initials if necessary.

**Foundation Screens**

- Account: Profile overview containing display name, login email, and profile picture.
- Edit Display Name: Inline editing or a small form within the Account page.

## API Design

### Account

**`GET /api/v1/auth/session`** — Extend the existing session response with the user's profile picture URL.

- **Payload:** None; authenticated session cookie.
- **Response:** `200 OK` — Existing session response with `user.pictureUrl`; Nullable.
- **Failure:** `401 Unauthorized` — Missing or invalid session.

**`PATCH /api/v1/account`** — Update the authenticated user's application display name.

- **Payload:** `{ "name": "Updated Display Name" }`; session cookie and CSRF token.
- **Response:** `200 OK` — Updated user profile with the existing session response shape.
- **Failure:** `401 Unauthorized` — Missing or invalid session.
- **Failure:** `403 Forbidden` — CSRF validation failed.
- **Failure:** `422 Unprocessable Entity` — Invalid display name.
- **Failure:** `429 Too Many Requests` — Rate limit exceeded.

## Low-Level Design

**Profile picture resolution**

- Resolve the OAuth provider picture URL from existing authentication identity data.
- Return the URL as `pictureUrl` when available; otherwise, return `null`.
- If the image is unavailable or fails to load, the frontend displays the generated initials avatar.

**Display name update**

- Authenticate the request using the existing session.
- Trim and validate the submitted name.
- Update `users.name`.
- Do not update the OAuth provider's name or credentials.

### Core Components

**AccountController** — Handles authenticated account profile requests.

- `show(): Response`
- `update(UpdateAccountRequest $request): Response`

**AccountService** — Updates the authenticated user's application profile.

- `update(User $user, UserData $data): User`

**UserData** — Carries validated application profile data.

- `name: string`

**ProfilePictureResolver** — Resolves the OAuth provider picture URL for the authenticated user.

- `resolve(User $user): ?string`

**GenerateAvatar** — Generates a frontend fallback avatar when no usable provider picture is available.

- `getInitials(string $name): string`
- `getBackgroundColor(string $name): string`

## Security

- All account endpoints require an authenticated session.
- Account updates require CSRF protection.
- Users can only access and update their own profile.
- Validate display names on the server.
- Do not accept arbitrary picture URLs from the account update endpoint.
- Resolve picture URLs only from trusted, supported OAuth provider identity data.
- Only allow HTTPS picture URLs from supported providers.
- Never expose OAuth access tokens, refresh tokens, or provider credentials in account responses.

## Testing

**Unit tests**

- Generate initials from single-word and multiple-word names.
- Generate deterministic avatar background colors.
- Resolve provider picture URLs when available.
- Return null when no provider picture exists.
- Validate display name trimming and length.
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
- Frontend displays initials when the picture URL is unavailable.
- Frontend falls back to initials when the provider image fails to load.
- Updating the display name refreshes the displayed name and generated initials.
