## Summary
The login page already has a \"Remember this device for 30 days\" checkbox, but:
- `LoginInput` / `loginSchema` don't include `remember` → never sent to API
- API `LoginRequest` doesn't accept `remember`
- `SessionService::issue()` always uses fixed 7-day lifetime (config `owner_cookie.lifetime_days`)
- Cookie is always persistent with fixed expiry

## Desired Behavior
| User choice | Session lifetime | Cookie type |
|-------------|------------------|-------------|
| Remember checked | 30 days (configurable) | Persistent cookie |
| Remember unchecked | 2 hours idle (or until browser close) | Session cookie (expires on browser close) |

## Implementation Plan

### Web
- `web/src/features/auth/schemas/index.ts` → add `remember: z.boolean().optional()` to `loginSchema`
- `web/src/features/auth/types.ts` → add `remember?: boolean` to `LoginInput`
- LoginPage already has checkbox + form state → no code change needed

### API
- `api/app/Auth/Requests/LoginRequest.php` → add `'remember' => ['nullable', 'boolean']` to rules
- `api/app/Auth/Actions/LoginOwner.php` → pass `remember` to `SessionService::issue($user, remember)`
- `api/app/Auth/Services/SessionService.php` → modify `issue(User $user, bool $remember = false)`:
  - `remember=true` → `expires_at = now()->addDays(config('session.remember_lifetime_days', 30))`, persistent cookie
  - `remember=false` → `expires_at = now()->addHours(2)`, **session cookie** (0 minutes = expires on browser close)
- `api/config/session.php` → add `'remember_lifetime_days' => env('SESSION_REMEMBER_LIFETIME_DAYS', 30)` to `owner_cookie`

### OpenAPI
- `docs/openapi.yaml` → `LoginRequest` schema: add `remember: { type: boolean, nullable: true }`

### Tests
- `LoginRequest` validation test for `remember`
- `SessionService` unit test for `issue()` with `remember=true/false`
- `LoginPage` feature test for both modes

---

### Related: Cross-tab session restore (separate issue)
The SPA currently boots from per-tab `sessionStorage` only, never calls `/auth/session` to restore from the cookie. A new tab with empty `sessionStorage` redirects to login even with a valid backend session. Fix:
- Add `'checking'` status to `AuthStatus`
- On boot with no stored session → call `authApi.session()` to revalidate via cookie
- Guards (`RequireAuth`, `GuestOnly`) render `null` while `checking`


Note: for this work we can reopen the existing github issue #78
