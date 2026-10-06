# Laravel Session Migration

## Status

Planned

## Context

Sendocs currently uses a custom database-backed session system.

It is already implemented and tested.

Laravel's built-in session system could replace it and reduce custom authentication code.

This is not required for the current feature work.

## Current System

Sendocs currently uses:

- Custom `sessions` table
- `SessionService`
- Hashed session tokens
- Custom owner auth guard
- Custom owner session cookie
- Custom session revocation
- Laravel Cookie API

## Target

Use Laravel's built-in session and authentication system.

The target flow is:

```
Browser
  ↓
Laravel session cookie
  ↓
Laravel session middleware
  ↓
Laravel auth middleware
  ↓
$request->user()
```

## Required Updates

### Documentation

Update:

- `docs/design.md`
- `docs/features/auth-and-access.md`
- `docs/decisions.md`

Review `docs/openapi.yaml` only if the external authentication contract changes.

Other feature documents should not be changed unless they contain session-specific rules.

### Backend

Replace the custom session implementation with Laravel sessions.

Remove or replace:

- `SessionService`
- Custom owner auth guard
- `sessions` table and migration
- Custom owner cookie configuration
- Custom session token generation and hashing
- Custom session resolution

Use Laravel:

- Session middleware
- Database session driver
- Authentication middleware
- `$request->user()`
- Laravel logout/session invalidation
- Laravel CSRF protection

### Configuration

Use Laravel's existing session configuration.

Configure the session lifetime and database driver through Laravel's standard settings.

Do not introduce a new Sendocs session configuration unless a real requirement cannot be expressed through Laravel configuration.

### Tests

Update authentication tests for Laravel sessions.

Keep coverage for:

- Login
- Logout
- Session expiry
- Multiple sessions/devices
- Session invalidation
- CSRF protection
- Unauthenticated requests
- Password change
- Account deletion
- E2E authentication flows

Remove tests that only verify the implementation details of the custom session system.

## Migration Rules

The migration must preserve existing external behavior unless explicitly changed.

In particular:

- Authenticated API requests remain cookie-based.
- Unauthenticated requests remain `401`.
- CSRF protection remains enabled.
- Session lifetime remains 7 days unless the feature decision changes.
- Other devices remain authenticated when one session is revoked where currently supported.
- No session token or internal session data is exposed through the API.

## Decision

Do not perform this migration during the current auth feature work.

The current custom session system is already implemented and tested.

Reconsider the migration only when there is a clear maintenance or architectural benefit.

If migration starts, update the documentation first and then refactor the implementation to match the updated source of truth.
