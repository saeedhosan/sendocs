# Client Portal — Technical Design

A client opens a magic link, sees what is being asked for, and uploads one file per item. This document covers the portal screens, upload flow, and client access rules. Token handling is covered in secure-magic-link.md, request and file validation in document-requests.md, and progress calculation in progress-tracking.md.

> The client portal is support unauthenticated surface in the system.

## Purpose

The client has no account and is typically on a mobile device. The portal must make uploads simple, allow retries, and safely display owner-provided labels without exposing the client to cross-site risks.

## Scope

### In Scope

- Client can view required items and their upload states.
- Client can upload one file per item with per-item retry.
- Client-side pre-checks to avoid uploading rejected files.
- Clear error messages for size, type, duplicate, network, and revoked-link cases.
- Auto-revalidation when the tab regains focus.
- Accessibility, mobile-friendly layout, and large tap targets.
- Limited client-visible data and strict non-disclosure of internal details.
- Browser requirements at the end for uploads and validate documents.

### Out of Scope

- Token generation, validation, expiry, and revocation covered: secure-magic-link.md.
- Request schema, file validation rules, object storage covered: document-requests.md.
- Progress calculation covered by progress-tracking.md.
- Owner screens (covered by owner-dashboard.md).
- Owner authentication (covered by auth-and-access.md`).
- Client accounts, passwords, and identity verification.
- Client-side download or replacement of uploaded files.
- In-portal messaging to owners.
- Reminders, expiry warnings, or notifications.
- Native app, email-upload, or offline queue.
- Branding, theming, or marketing copy.

## UX and UI

**Routes**

- `/portal/{token}`, single-page portal. No: sub-pages, navigation or complex menus.

**User Flow**

```text
Client
  |
Opens the Link
  |
Sees Every Required Item
  |
Uploads in Any Order
  |
Leaves Midway and Returns to the Same URL
  |
Finishes the Rest
  |
Complete, With Nothing Left to Do
```

**Upload Flow**

```text
Client
  |
Picks a File
  |
Local Pre-check
  |
Rejected Before Upload, or Transferred
  |
Per-item Error With One-Tap Retry
  |
Item Marked Uploaded
```

**Foundation Screens**

- Portal: request title, required items, and their states in one list.
- Item row: label, state, and action; no modal per item.
- Upload failure: inline message on the offending row.
- Complete state: shown when all items uploaded; no further actions.
- Dead link: screen from secure-magic-link.md, rendered without portal shell.

**Navigation Screens**

- None. Single screen with no back button or menu.
- Refreshing returns to the same URL.

**Discovery Screens**

- No uploads yet (default).
- File rejected locally before upload.
- Upload failed mid-transfer with per-item retry.
- Link revoked or expired while page is open.
- JavaScript unavailable (stated clearly).
- Unsupported browser or file picker (accepted types listed).

**Portal Behavior**

- **One page** — all required items on a single screen; uploads can be in any order.
- **Resumable** — progress is derived, so leaving and returning preserves completed uploads.
- **Per-item state** — each row shows waiting, uploading, uploaded, or failed, with retry on failure.
- **Mobile-first** — responsive layout with large tap targets.
- **Accessible** — labelled controls, visible focus, and status not conveyed by color alone.

## Data Design

The portal adds nothing to the server schema. Every value it shows comes from the portal response.

**Client state**

| Store         | Lifetime                       | Contents                                           |
| ------------- | ------------------------------ | -------------------------------------------------- |
| `TokenHolder` | Until reload or leaving        | The token, read once from the path, never stored   |
| `PortalView`  | Until the next refetch         | Title, items, per-item state, expiry, progress     |
| `Transfer`    | Per in-flight upload           | Bytes sent, total bytes, rate, and the file handle |
| `ItemError`   | Until that item succeeds again | The failure code and a retry count for one item    |

**Rules:**

- Token lives in memory only; never stored in localStorage, cookies, query string, or history state.
- File handles held only during transfer and dropped when it settles.
- No service worker cache for portal data.
- Reload refetches from API; browser is not source of truth.
- No offline upload queue.

> Token treated as in-memory credential, consistent with `secure-magic-link.md`.

## API Design

### Consumed Endpoints

**GET /api/v1/portal/{token}** — Load the portal view.

- **Payload:** none; the token is in the path
- **Response:** `200` — `PortalView`: request title, `expiresAt`, the four progress fields including `lastActivityAt`, and every item
- **Failure:** `410` — unknown, malformed, expired, revoked, or tampered, one identical body for all five
- **Failure:** `429` — rate limited (60 reads per minute per IP)

**POST /api/v1/portal/{token}/items/{itemId}/file** — Upload one file for one item.

- **Payload:** `file` (multipart)
- **Response:** `200` — the updated portal view
- **Failure:** `404` — the item is not on the request this token resolved
- **Failure:** `409` — the item already has a file
- **Failure:** `410` — unknown, malformed, expired, revoked, or tampered, one identical body
- **Failure:** `413` — over the 25 MB cap
- **Failure:** `415` — sniffed type not allowed, or extension mismatch
- **Failure:** `429` — rate limited (30 uploads per hour per IP)

> Validation and storage semantics are in `document-requests.md`; `410` rules in `secure-magic-link.md`. No owner endpoint is reachable from this surface.

**What the Portal Needs**

- View returns every item (uploaded or not).
- Per-item state is sufficient; portal computes no progress.
- No create-style one-time secret; portal can refetch freely.
- Uploads are POST; no CSRF token on this surface.
- No signed URLs returned to client.

### Core Components

**PortalController** — Serve the app shell for the single portal route, with no owner data in it.

- `show(): Response`

**PortalApp** — Boot the React app, read token, and load view. `PortalView`/`PortalItem` carry no download URL, storage key, or `mimeType`.

- `boot(): Promise<PortalView>` — read path once; call portal endpoint
- `refetch(): Promise<PortalView>`
- `onDeadLink(): void`

**ItemList** — Render required items and states.

- `mount(items: Item[]): void`
- `render(): void`
- `remaining(): number` — from payload, never recounted locally

**ItemUpload** — Pick, pre-check, transfer, and report one item.

- `pick(itemId: string): void`
- `precheck(file: File, itemId: string): PrecheckResult`
- `send(itemId: string, file: File): Promise<void>`
- `retry(itemId: string): void`

**TransferWatcher** — Report bytes sent for upload progress.

- `watch(xhr: XMLHttpRequest): void` — emits percentage and rate
- `cancel(): void`

**DeadLink** — The single dead-link screen defined in `secure-magic-link.md`.

- `render(): void` — no portal shell, no request title, no item labels

**UploadErrors** — Map a failure code to a sentence the client can act on.

- `message(code: string): string`
- `retryable(code: string): boolean`

## Low-Level Design

**One Screen**

- Title, all items, and actions on one page.
- Remaining count shown above the list.
- No accordion, modal, or wizard; rows are independently actionable.
- Optimized for mobile.

**Item Rows**

- Label plus state and at most one action.
- States: Waiting, Uploading, Uploaded, or Failed (text first).
- Color not the only indicator.
- Long labels wrap; full text preserved for accessibility.
- Rows in owner-specified order.

**Uploading in Any Order**

- No enforced order.
- Out-of-order uploads are normal.
- Progress is by count, not sequence.
- Sequential uploads rejected (stall whole list on slow file).

**Pre-Check Before Sending**

- Size and extension checked locally before sending.
- Rejected files never touch network.
- Server still determines sniffed MIME type (local check is a courtesy).
- Accepted types shown in picker.
- Size cap 25 MB; max 10 items; both shown on screen.

**Transfer Feedback**

- Progress from XMLHttpRequest upload progress event.
- Percentage is per file (not total item count).
- Rate shown only during transfer.
- Sub-1% shows indeterminate bar.

**Concurrency**

- Max two transfers at once.
- Third waits in visible queue.
- One failure doesn't cancel others.
- Cap of two is optimal for mobile latency.

**Leaving and Returning**

- Uploaded files persist (belong to request).
- Returning to same URL shows completed uploads.
- No local draft state.
- Leaving mid-transfer loses that file; client re-picks on return.

**Failed Uploads**

- Failure shows inline on row; item remains retryable.
- Retry resends only that file.
- Retry subject to per-hour upload cap (message shown if hit).
- No chunked resume; failed transfer restarts from zero.

**Duplicate Upload**

- Second upload to same item returns 409; row marked Uploaded.
- Upload action not offered for items with existing files.
- 409 treated as success for stale pages.
- No client disclosure of file owner.

**Revocation Mid-Session**

- Revocation while uploading returns 410 on next request.
- App switches to dead-link screen immediately.
- In-flight transfers cancelled and discarded.
- Pending uploads may be lost; UI warns on leaving with active transfers.

**Revalidation**

- View refetched on tab focus and after each successful upload.
- Revoked/expired links surface on return.
- 410 is final for session; no retry loop.
- No cached view shown if server rejects.

**Rendering Owner-Supplied Text**

- Labels and title from owner; only cross-user text in product.
- Inserted as text nodes; never as HTML/markdown.
- Full text preserved for accessibility.

**No Inline File Preview**

- Uploaded files never rendered in portal.
- Previewing (e.g. PDF/SVG) is avoided to prevent script execution.
- Portal shows only filename and size.
- Previews belong to owner's signed-URL surface, not here.

**Browser Requirements**

- JavaScript required for uploads.
- If JS unavailable, page states this clearly.
- Supports current two major browsers.
- Plain file input; camera capture works on mobile.
- No service worker, WebSocket, or background sync.

**Mobile Behavior**

- Touch targets, widths, and hover rules in ../frontend.md.
- Uploads don't lock scrolling.
- Orientation changes don't cancel transfers.

**Accessibility**

- State changes announced via live region.
- Focus moves to first failed item after batch finishes.
- Buttons have accessible names including item label.
- Remaining count is a heading.
- Errors associated with their row.

## Trade-offs

**Pre-Check Locally, Validate on the Server**

- Benefit: rejected files cost no client data or wait.
- Cost: two rules must stay aligned; server remains authoritative.
- Rejected: server-only validation to avoid wasting mobile data.

**Two Concurrent Transfers**

- Benefit: slow files do not block others without ten concurrent uploads.
- Cost: requires a visible queue and concurrency rule.
- Rejected: sequential uploads and ten-at-once concurrency.

**No Resumable Uploads**

- Benefit: one stream per file, no chunk bookkeeping or partial objects.
- Cost: failed transfers restart from zero.
- Rejected: resumable uploads because each object is written in one pass.

**One Screen, No Navigation**

- Benefit: simple client experience with no navigation or forced order.
- Cost: long lists on mobile; remaining count and wrapping mitigate this.
- Rejected: a wizard because items have no required order.

**No File Preview**

- Benefit: uploaded files are never rendered in the client portal.
- Cost: clients cannot visually verify their selection.
- Rejected: previews because uploaded content must not render here.

**Treat 409 as Success**

- Benefit: stale tabs converge without showing an error.
- Cost: client does not know the second file was discarded.
- Accepted because the item already has the intended single file.

**JavaScript Required**

- Benefit: enables progress, pre-checks, and live regions.
- Cost: clients without JavaScript cannot use the portal.
- Rejected: server-rendered forms because this surface deliberately uses no cookie.

**No Client-Side Download**

- Benefit: clients never receive readable object-store keys.
- Cost: only the owner can fix a mis-upload.
- Accepted: pending the client-download open question.

## Security

**Untrusted Rendering**

- Third-party text is rendered as text only; no markup, markdown, or URL rendering.
- DOM nodes use text insertion, never innerHTML.
- User-controlled values never reach executable attributes.

**Hostile File Content**

- Files are content-validated, never rendered or previewed.
- Filenames are sanitized and truncated; paths are stripped.
- SVG and HTML are rejected.
- The client cannot choose storage keys, content types, or paths.

**Token Hygiene**

- The token is read once and kept in memory; never stored or added to history.
- It is never placed in query parameters.
- Referrer-Policy and CSP are defined in secure-magic-link.md.
- The portal sets no cookies.

**No Third-Party Anything**

- No analytics, error reporting, chat widgets, CDNs, or external fonts.
- Fonts and icons are self-hosted.

**Failure Disclosure**

- Unknown, expired, and revoked links show the same message.
- Dead-link responses reveal no request data or existence.
- Item errors expose only the item and reason.
- 500 responses offer retry; no internal details are exposed.

**Data Minimisation**

- The portal returns only this request's title, items, expiry, and counts.
- No owner identity, other requests, or account state is exposed.
- No analytics track opens or uploads.

**Rate Limits as Abuse Control**

- Reads: 60/min per IP.
- Uploads: 30/hour per IP.
- File size and type caps bound storage abuse.
- Owner revocation immediately ends access.

## Performance

- **First load** — one static shell, then one portal request; no other third-party bytes.
- **Per upload** — one multipart request; PHP writes the upload to a temporary file, then the API validates it and streams it to private storage.
- **Concurrency** — at most two transfers, so a phone's connection is not fragmented.
- **Validation** — the local pre-check avoids a doomed transfer entirely; server sniffing reads only the first bytes.
- **Refetch** — on focus and after each upload, never on a timer.
- **Payload** — a portal view is a title, up to ten items, and four numbers; there are no file bytes.
- **Rendering** — the list is small enough that no virtualisation is needed.
- **Budget** — the page is dominated by the transfer, not by anything this design adds.

## Error Handling

| Status | Code                | Cause                                           | Behaviour on screen                           |
| ------ | ------------------- | ----------------------------------------------- | --------------------------------------------- |
| `404`  | `not_found`         | The item is not on this request                 | Reload the view; the row disappears.          |
| `409`  | `duplicate_upload`  | The item already has a file                     | Treated as success; the row reads done.       |
| `410`  | `invalid_link`      | Unknown, expired, revoked, or tampered          | Dead-link screen, once, with no retry.        |
| `413`  | `file_too_large`    | Over the 25 MB cap                              | Inline on the row, with the cap stated.       |
| `415`  | `unsupported_type`  | Sniffed type not allowed, or extension mismatch | Inline on the row, naming the accepted types. |
| `422`  | `validation_failed` | Field-level failure from the API                | Inline on the offending row.                  |
| `429`  | `rate_limited`      | Read or upload budget exhausted                 | Show the wait; disable the action.            |
| `500`  | `internal_error`    | Unexpected failure                              | Inline retry; no internals revealed.          |

**Response Shape**

- `{ "error": { "code", "message", "details" } }`, the same shape as every other endpoint.
- A type failure names the detected type, never the client-declared header value.
- A size failure returns the standard `413` envelope. PHP or the proxy may already have received or buffered request bytes before Laravel responds.

**Local Rejections**

- Locally rejected file never becomes a request.
- Shown in same inline style as server rejections.
- Message names limit and accepted types.

**Terminal vs Retryable**

- 410 — terminal for session; no retry.
- 413, 415 — terminal for that file; pick another.
- 409 — terminal but successful; row marked done.
- 429, 500 — retryable; row stays actionable.

## Testing

**Unit Tests**

- precheck accepts a file at the cap and rejects one byte over it.
- precheck accepts each allowed extension and rejects a disallowed one.
- precheck rejects a file whose extension disagrees with its name and type.
- remaining counts from the payload and never recomputes from local state.
- UploadErrors.message produces a distinct sentence per code, with no server text.
- retryable is true for 429 and 500 and false for the rest.
- A label containing script or img onerror renders as text.
- A label with path separators renders as text and never as a path.

**Feature Tests**

- A valid token renders the title and every item, uploaded or not.
- Unknown, malformed, expired, revoked, or tampered token renders same dead-link screen.
- Dead-link screen contains no title, no label, no item count.
- The token is never written to localStorage, a cookie, or the query string.
- No portal response sets a cookie.
- Uploading one file marks that row done and leaves every other row untouched.
- Uploading an item twice returns 409 and the row reads done, not failed.
- A 25 MB file is accepted and 25 MB plus one byte is 413, inline on the row.
- A renamed file is 415, and the message names the accepted types.
- A locally rejected file produces no network request.
- A failed transfer leaves the row retryable and resends only that file.
- Three concurrent picks run two at a time, with the third visibly queued.
- A 410 during an upload cancels the transfer and shows the dead-link screen.
- Refocusing the tab refetches, and a revoked link surfaces without a click.
- The portal never renders an uploaded file inline.
- A 429 shows the wait from Retry-After and disables the action until it elapses.

**End-to-End Tests**

- Client opens link on mobile and uploads all items in random order.
- Client leaves after two uploads, returns later, and finishes rest.
- Client uses camera to capture and upload photo.
- Screen reader announces state changes; focus lands on first failure.
- Orientation change mid-transfer doesn't cancel upload.
- Revoked link on second device shows dead-link screen (no shell).

## Open Questions

**Client Download**

- Clients cannot view or re-download uploaded files; owners must fix mis-uploads.
- Open: allow clients to download their files?
- Option: Keep downloads owner-only.
- Option: Allow clients to download their own files with signed URLs.

**Replacing a File**

- A second upload returns 409; clients cannot delete their file.
- Open: allow clients to replace their file before owner download?
- Option: Keep replacement owner-driven.
- Option: Allow client replacement before owner download.

**Expiry Warning**

- The portal shows the expiry date but gives no warning as it approaches.
- Open: add an in-portal expiry warning?
- Option: Show only the expiry date.
- Option: Show a warning when expiry is near.

**Large Files on Mobile Data**

- The 25 MB cap suits scans but not videos or large archives.
- Open: vary limits or accepted types per item?
- Option: Keep one 25 MB limit for all items.
- Option: Allow per-item limits and types.

**Upload Queue Persistence**

- Closing the tab loses pending transfers.
- Open: persist the queue, or require manual retry?
- Option: Keep the queue in memory only.
- Option: Persist pending uploads locally.

**Confirmation Before Leaving**

- Closing the tab during an upload loses the transfer.
- Open: warn before leaving while uploads are active?
- Option: Allow leaving without warning.
- Option: Show a warning while uploads are active.

**Accessibility Audit**

- The portal is the least tested surface and has the widest audience.
- Open: schedule a real assistive-technology audit?
- Option: Keep the current manual checks.
- Option: Run an assistive-technology audit.
