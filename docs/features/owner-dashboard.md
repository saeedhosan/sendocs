# Owner Dashboard - Technical Design

The signed-in dashboard lets owners view, track, and manage document requests. It covers dashboard screens and interactions; request APIs, progress, link security, and authentication are defined in their respective feature documents.

## Scope

### In Scope

- Request list: columns, order, cursor pagination, row states.
- Request detail: header, items, per-item state, files, action bar.
- New request form: item entry, ordering, validation feedback.
- Navigation between screens, account menu, and sign-out.
- Link sharing, including once-only reveal.
- Confirmations for revoke, delete document, and delete request.
- Session-aware states: signed out, expired, CSRF failure.
- Accessibility and responsive design.

### Out of Scope

- Request API, validation, schema covered by document-requests.md.
- Progress derivation and labels covered by progress-tracking.md.
- Token security, expiry, revocation covered by secure-magic-link.md.
- Sessions, cookies, passwords, CSRF covered by auth-and-access.md.
- Client portal covered by client-portal.md.
- Filters beyond status, search, saved views, bulk actions.
- Notifications, reminders, expiry warnings.
- Native/offline dashboard.
- Teams, workspaces, shared ownership.

## UX and UI

**Routes**

- `/dashboard` - request list (signed-in landing page).
- `/requests/new` - create a new request.
- `/requests/{id}` - View and manage the request detail.
- `/settings/password`, `/settings/delete` - covered by auth-and-access.md.

**User Flow**

```text
Owner
  |
Dashboard
  |
Open an Existing Request, or Start a New One
  |
Read Missing Items and Progress
  |
Share, Download, Revoke, or Delete
  |
Back to Dashboard
```

**Empty State Flow**

```text
Owner
  |
Dashboard Is Empty
  |
Create the First Request
  |
Link Revealed Once and Copied
  |
Client Uploads
  |
Dashboard Shows Progress on Return
```

**Foundation Screens**

- Request list: title, status, progress, uploaded/total counts, last activity.
- New request: title, 1–10 item rows, add/remove/reorder.
- Request detail: status, expiry, item states, file actions, and link controls.
- Link revealed once: copy first, with visible text fallback.
- Empty dashboard: one sentence, one action, no sample data.
- Not found: same screen for deleted or not-owned requests.

**Navigation Screens**

- New request from dashboard header.
- Request detail from list row.
- Dashboard from brand and every detail screen.
- Account settings and sign out from user menu.
- After completed actions, navigate to dashboard (never dead detail URL).

**Discovery Screens**

- No requests yet.
- Nothing uploaded yet on a single request.
- Link expired or revoked.
- Session expired mid-task (form state preserved).
- Rate limited (show wait time).
- Download failed (offer retry).
- Revoke and delete confirmations naming what is lost.

### Client Components

**SessionGate** - Client-side route guard, the app-side half of `AuthenticateSession`.

- `boot(): Promise<User>` - one call to GET /auth/session
- `onUnauthorized(): void` - route to sign-in, preserving the intended destination

**RequestList** - The list, its paging, and its row states.

- `mount(cursor: ?string, limit: int): void`
- `loadMore(): Promise<void>`
- `previous(): Promise<void>` - only while the cursor stack is intact

**RequestRow** - One row: title, status, progress, counts, and last activity.

- `statusLabel(r): string`
- `progressLabel(r): string`
- `timeAgo(iso: string): string`

**RequestDetail** - Header, items, files, and the action bar.

- `mount(id: string): Promise<void>`
- `download(docId: string): void`
- `removeDocument(itemId: string): Promise<void>` - called by `ItemRow.remove`, then re-reads the request
- `revoke(): Promise<void>`
- `destroy(): Promise<void>`

**ItemRow** - One required item and its current state.

- `stateLabel(item): string`
- `fileAction(item): string` - download when present, waiting when not
- `remove(item): Promise<void>` - delete the document, only when one exists

**NewRequestForm** - Title and the item rows.

- `addRow(): void`
- `removeRow(index: int): void`
- `move(index: int, direction: int): void`
- `submit(): Promise<void>`

**LinkReveal** - Show the raw link exactly once.

- `show(link: string): void`
- `copy(): Promise<void>`
- `dismiss(): void`

**ConfirmDialog** - One dialog for every destructive action.

- `ask(action: 'revoke' | 'delete-document' | 'delete-request', subject: string): Promise<bool>`
- `confirm(): void`

**Notice** - Non-blocking outcome messages, never the only feedback.

- `ok(message: string): void`
- `error(code: string): void`

**EmptyState** - The first-run and per-request zero states.

- `render(context: 'dashboard' | 'request'): void`

## Data Design

The dashboard stores nothing on the server.
It adds no table and no migration; every value it shows comes from the request API.

**Client state**

| Store          | Lifetime                        | Contents                                    |
| -------------- | ------------------------------- | ------------------------------------------- |
| `SessionStore` | Until sign-out or a 401         | User, CSRF token, session expiry.           |
| `RouteCache`   | One route, dropped on navigate  | The list page or the single request.        |
| `DraftStore`   | Until submit succeeds or closes | Title and item labels being typed.          |
| `LinkReveal`   | One shot, memory only           | The raw link, until dismissed or refreshed. |

**Rules:**

- No token, raw link, or file byte is written to localStorage, a cookie, or the URL.
- The session cookie is HttpOnly, so no store can read it even by accident.
- The list cursor is the only thing kept in the query string, and it discloses nothing.
- A refresh refetches from the API, so the browser never becomes the source of truth.

> Keeping the raw link in memory only is why closing the reveal loses it. That matches the API rule in secure-magic-link.md: there is nothing to come back to.

## API Design

### Consumed Endpoints

**GET /api/v1/requests** - One page for the list.

- **Payload:** `limit`, `cursor` (query parameters)
- **Response:** `200` - a page of requests, each with counts and an `nextCursor`
- **Failure:** `401` - no valid session
- **Failure:** `422` - malformed cursor
- **Failure:** `429` - rate limited, with Retry-After

**GET /api/v1/requests/{id}** - One request with signed download URLs.

- **Payload:** none; session cookie
- **Response:** `200` - title, expiry, revoked state, items, and a signed URL per uploaded document
- **Failure:** `401` - no valid session
- **Failure:** `404` - not found, or owned by another owner
- **Failure:** `429` - rate limited, with Retry-After

**POST /api/v1/requests** - Create a request (returns magic link once).

- **Payload:** `title`, `items`
- **Response:** `201` - request, items, and magic link (shown once)
- **Failure:** `422` - validation failed with per-field details
- **Failure:** `429` - rate limited

**POST /api/v1/requests/{id}/revoke** - Revoke the client link.

- **Payload:** none; session cookie plus CSRF header
- **Response:** `200` - the request with `revokedAt` set
- **Failure:** `404` - not found, or owned by another owner

**DELETE /api/v1/requests/{id}/items/{itemId}/document** - Delete one uploaded document.

- **Payload:** none; session cookie plus CSRF header
- **Response:** `204` - no content
- **Failure:** `404` - not the caller's item, or no document on it

**DELETE /api/v1/requests/{id}** - Delete the request and every file in it.

- **Payload:** none; session cookie plus CSRF header
- **Response:** `204` - no content
- **Failure:** `404` - not found, or owned by another owner

**GET /api/v1/auth/session** - The caller, CSRF token from auth-and-access.md.

> Request semantics are defined in document-requests.md and session semantics in auth-and-access.md. This section defines only what the screens need. Any endpoint may also return 401 or 429; writes may return 403 for a stale CSRF token.

**What the Screens Need**

- **List:** one page per fetch; cursor from URL; no polling.
- **Detail:** signed URLs are minted per view; never cached or stored.
- **Create:** render from the response; never refetch the link.
- **Writes:** revoke and deletes send X-CSRF-Token.
- **401:** handled centrally by the shell.

## Low-Level Design

**List Layout**

- Columns: title, status, progress, uploaded/total, and last activity.
- Newest first, matching the cursor order.
- No client-side sorting.
- Title is the row link; actions remain separate.
- Last activity is relative, with the full timestamp available.

**Paging**

- Cursor lives in the query string, so refresh restores the page.
- Next uses the API cursor; no page numbers.
- Previous uses an in-memory cursor stack and resets on reload.

**Refreshing**

- No polling or sockets.
- Refetch on window focus and after owner writes.
- Manual refresh is available for live progress checks.

**Status and Progress**

- Status is derived from API counts, not stored.
- Uploaded items show Complete; others show Waiting on client.
- Revoked is separate; expiry belongs to the link panel.
- Progress always includes a text label.

**Empty States**

- No requests: one sentence and one create button.
- Empty items show Waiting on client.
- Complete requests emphasize downloads.
- Dead links still leave owner files accessible.

**Link Reveal**

- Create renders the link directly from the response.
- Copy is primary; selectable text is the fallback.
- The screen states the link is shown only once.
- Closing drops the link from memory; refresh cannot restore it.

**Deleting a Document**

- Uploaded items show download and delete actions.
- Delete uses the shared confirmation dialog.
- Success refetches the request instead of updating counts locally.
- Only owners can delete documents.

**Destructive Actions**

- Revoke and deletes use one confirmation dialog.
- The dialog names the exact target and consequence.
- Cancel receives initial focus; Enter does not confirm.
- No undo or soft delete.
- Revoke and request delete return to the dashboard.

**Downloads**

- Signed URLs are minted per view and never stored.
- Browser downloads files directly with attachment disposition.
- Failed downloads refetch the request before retrying.
- Multiple item downloads can run concurrently.

**Forms**

- Client validation mirrors API rules.
- Items support keyboard add, remove, and reorder.
- The item limit is enforced before submission.
- Failed submits preserve all fields.
- Submit is disabled while in flight.
- Server errors focus the first invalid field.

**Session States**

- The route guard resolves the session before dashboard content mounts.
- 401 redirects to sign-in and preserves the destination.
- 403 refreshes CSRF once; a second failure signs out.
- 429 shows Retry-After and preserves form state.

**Rendering**

- Shell loads first, then the page and rows.
- Skeletons keep layout stable while data loads.

**Accessibility**

- All actions are keyboard accessible.
- Dialogs trap focus and return it on close.
- Status and progress never rely on colour alone.
- Copy results are announced to assistive technology.
- Downloads expose predictable filenames.

**Responsive Behaviour**

- Widths, touch targets, and full-sheet dialogs follow frontend.md.
- Row actions collapse into a menu on narrow screens.
- Progress remains visible; counts move below when needed.

### Core Components

**DashboardController** - Return the app shell for each dashboard route.

- `index(): Response`
- `create(): Response`
- `show(string $id): Response`

## Trade-offs

**Single-Page Rendering**

- Benefit: one rendering model and shared components.
- Cost: screens wait for fetches, and a broken bundle blocks the dashboard.
- Server rendering was rejected to avoid two rendering models.

**Cursor in the URL**

- Benefit: refresh and copied URLs restore the same page.
- Cost: Previous state is lost after reload.
- Offset pagination was rejected for deep-page performance and consistency.

**No Live Updates**

- Benefit: no polling, sockets, or reconnect logic.
- Cost: progress can be stale until refetch.
- Focus refetch and manual refresh mitigate this.

**Reveal Once, No Reissue**

- Benefit: no persistent live link in the owner's browser.
- Cost: closing the reveal permanently loses the link.
- Accepted to match the API rule.

**Confirmation Without Undo**

- Benefit: destructive actions are explicit.
- Cost: no recovery after confirmation.
- Undo was rejected because deletion is already complete.

**Owner Deletes, Client Cannot**

- Benefit: owners retain control without extra portal endpoints.
- Cost: wrong uploads require another client upload.
- Client deletion was rejected.

**Relative Time**

- Benefit: recency is visible at a glance.
- Cost: it drifts, so the absolute timestamp remains available.

**No Filters or Search**

- Benefit: simpler queries and indexing.
- Cost: large request lists require scanning.
- Deferred while request counts remain small.

## Security

**Session Boundary**

- Every dashboard route requires AuthenticateSession.
- Route guards resolve the session before views mount.
- API queries enforce ownership; other owners return the same 404.
- The static shell contains no owner data.

**CSRF on Writes**

- Create, revoke, and deletes send X-CSRF-Token.
- The token stays in memory and never in a cookie.
- A 403 refreshes CSRF once; a second failure signs out.
- GET reads and downloads need no CSRF token.

**Output Handling**

- Owner-supplied titles and labels are always escaped.
- original_name is display-only and never used as a path.
- Link reveals use textContent, never innerHTML.

**Client-Side Secret Hygiene**

- Session cookies are HttpOnly and unreadable by JavaScript.
- Links and CSRF tokens stay memory-only.
- Sign-out clears client-side state.

**No Third-Party Assets**

- No analytics, error reporters, or CDN scripts.
- Fonts and icons are self-hosted.
- Dashboard requests never expose session data to third parties.

**Download Safety**

- Downloads use five-minute signed URLs with attachment and nosniff.
- Each signed URL is bound to one storage key.
- Display filenames never become storage paths.

## Performance

- **First paint** - cached shell, then skeleton while data loads.
- **List** - one request per page with progress and counts included.
- **Detail** - one request per view; signed URLs minted there.
- **Writes** - one request each; buttons disabled while in flight.
- **No polling** - refetch on focus; idle tabs cost nothing.
- **Payload** - twenty-request pages stay small; no file bytes included.
- **Downloads** - object storage serves file bytes directly.
- **Caching** - no durable cache, so no stale state to invalidate.

## Error Handling

The dashboard never creates endpoints error code and messsages come from API response.

**Screen Behavior**

- 401 routes to sign-in and preserves form state.
- 403 refreshes CSRF once; a second failure signs out.
- 404 shows the not-found screen.
- 422 focuses the first invalid field.
- 429 waits for Retry-After.
- 500 offers retry and shows the correlation ID.

**Create Response Lost**

- If creation succeeds but the response is lost, the link cannot be recovered.
- The screen reports creation without showing a link.
- Link recovery remains an open question.

**Destructive Outcomes**

- Revoke and delete show success only after API confirmation.
- Failed deletes leave state unchanged and keep the dialog open.

## Testing

**Unit Tests**

- progressLabel covers zero, partial, and complete.
- timeAgo covers minutes, hours, days, and 30+ days.
- statusLabel covers waiting, complete, revoked, and expired.
- Relative time includes an accessible absolute timestamp.
- script in titles renders as escaped text.
- Path separators in filenames never become paths.

**Feature Tests**

- Unauthenticated users redirect to sign-in with destination preserved.
- Session resolves before mount; shell contains no owner data.
- List shows only the owner's requests, newest first.
- URL cursor restores the same page after refresh.
- Previous works until reload; cursor history is in memory.
- Focus and writes trigger refetch; timers never do.
- Create sends CSRF and preserves fields after 422.
- Submit disables in flight; double-click creates once.
- An eleventh item cannot be submitted.
- Create response reveals the link once; refetch never restores it.
- Closing the reveal removes the link from memory.
- Copy uses the clipboard and shows fallback on failure.
- Destructive actions name the target and focus Cancel.
- Revoke hides the link and shows revoked state.
- Document delete returns the item to waiting using API counts.
- Request delete returns to the dashboard.
- Other owners' requests show the same not-found screen.
- Expired download URLs offer retry.
- 429 uses the wait from Retry-After.
- Sensitive data never enters localStorage or cookies.

**End-to-End Tests**

- Register, create request, copy link, client uploads; owner sees updated progress.
- Mobile: sign in, list, detail, and file actions.
- Keyboard only: create, copy, revoke, and delete.
- Screen reader: status, progress, and copy result are announced.
- Sign out, open dashboard URL, sign in, and return to the same page.

## Open Questions

**Live Updates**

- Progress can be stale while a tab stays open.
- Open: add manual refresh or polling while visible?
- Option: Manual refresh only.
- Option: Poll while the tab is visible.

**Create Response Lost**

- A committed request may have an unknown link.
- Open: provide a recovery path?
- Option: Show created, link not shown.
- Option: Allow one-time link reissue.

**Filters and Search**

- The list is unfiltered for small request volumes.
- Open: add server-side filters or search?
- Option: Keep the list unfiltered.
- Option: Add server-side filtering and search.

**Sorting**

- Order is fixed at newest first.
- Open: support sorting by last activity?
- Option: Keep newest-first ordering.
- Option: Add a second cursor and index.

**Previous After Reload**

- Previous depends on an in-memory cursor stack.
- Open: preserve backward paging after reload?
- Option: Keep forward-only paging after reload.
- Option: Encode backward cursors in the URL.

**Bulk Actions**

- Each revoke or delete currently requires confirmation.
- Open: support bulk actions?
- Option: Keep individual actions.
- Option: Add bulk revoke and delete.

**Relative Time**

- Recency is relative with an accessible absolute timestamp.
- Open: switch to absolute dates?
- Option: Keep relative time.
- Option: Show absolute dates.

**Offline Reading**

- No durable cache means disconnected reads show an error.
- Open: support cached dashboard reads?
- Option: Keep the dashboard online-only.
