# Progress Tracking — Technical Design

Progress is the uploaded item count divided by the total item count, derived on every read rather than stored to prevent counter drift.

> References: docs/features/document-requests.md, docs/features/owner-dashboard.md, docs/features/client-portal.md, docs/features/secure-magic-link.md

## Scope

### In Scope

- Definition of progress and a complete request.
- Deriving uploaded and total counts from documents and items.
- Status values derived from counts.
- Last activity and its purpose.
- Computing counts for one request and a page without N+1 queries.
- Serializing progress consistently across API and screens.
- Why progress can regress.

### Out of Scope

- Request creation, item rules, document delete endpoint covered document-requests.md.
- File validation and storage covered by document-requests.md.
- Screens displaying progress covered by owner-dashboard.md, client-portal.md.
- Refetch/polling policy (owned by screens).
- Link state, expiry, revocation covered by secure-magic-link.md.
- Notifications, reminders, email digests, analytics.
- Per-file/per-byte progress.
- Stored completion timestamp.

## UX and UI

**Routes**

- None of its own; progress rides on the existing list, detail, and portal responses.

**User Flow**

Upload increases count:

```text
Client Uploads One File
  |
Next Read Counts Documents
  |
Uploaded Increases
  |
Status Flips to Complete When Done
```

Deletion decreases count:

```text
Owner Deletes a File
  |
Next Read Counts One Fewer Document
  |
Uploaded Decreases
  |
Status Can Return to Waiting
```

**Foundation Screens**

- Progress label, the fraction the owner reads first, rendered by owner-dashboard.md
- Progress bar, always paired with that label so it is never colour alone

**Navigation Screens**

- Not applicable; progress is a value on a screen owned elsewhere.

**Discovery Screens**

- Nothing uploaded yet (zero shown, not error).
- Complete.
- Progress moved backwards after document deletion.
- Stale numbers (last activity indicates recency).

## Data Design

Progress has no table; it is computed from existing tables with no schema changes.

**Derived Values**

| Value            | Expression                                      | Source                              |
| ---------------- | ----------------------------------------------- | ----------------------------------- |
| `total`          | Count of request items                          | `request_items`                     |
| `uploaded`       | Count of items with a document                  | `request_items LEFT JOIN documents` |
| `status`         | `complete` if uploaded == total, else `waiting` | Both counts                         |
| `lastActivityAt` | Newest document `uploaded_at`, or null          | `documents`                         |
| `remaining`      | `total - uploaded`                              | Both counts                         |

**Rules:**

- No status, percentage, or completion column stored.
- Unique index on `documents (request_item_id)` ensures exact count.
- `total` never zero (request must have ≥1 item).
- `lastActivityAt` is null when nothing uploaded.
- No caching; no migration/backfill needed.

> Storing progress requires writes from upload, delete, and create—any miss causes drift. Derivation avoids this.

## API Design

No endpoint exists for progress on its own

**What the Payload Guarantees**

- `uploaded` and `total` are integers, never strings and never floats.
- `status` is a closed set of exactly two values, so a client cannot invent a third.
- The four fields always describe the same request row they are attached to.
- They appear on all three reads: the list, the detail, and the portal view.
- No percentage is sent, so no client can round differently from another.

## Low-Level Design

**Definition**

- Progress is the uploaded item count over the total item count.
- Uploaded means exactly one thing: the item has a document row.
- An item with no document is not uploaded, whatever else is true about the request.
- Total is never zero, so there is no divide-by-zero branch anywhere in the code.
- The fraction is computed from two integers, never from a stored decimal.

**Two Independent Axes**

- Upload progress and link state are separate facts and never collapse into one number.
- A revoked link can sit at one hundred percent, and a live link can sit at zero.
- Link panel shows expiry/revocation; progress chip shows uploads only.
- Combining them could show 67% complete for an unusable link.

**Nothing Is Stored**

- There is no status column, no percentage column, and no completed-at column.
- Progress cannot contradict the documents because it is derived from them.
- The cost is recomputation on read, which is one grouped query either way.
- The other benefit is free: there is no backfill when the counting rule changes.

**Counting**

- uploaded counts documents via request_items LEFT JOIN documents.
- No DISTINCT; each item has at most one document.
- LEFT JOIN keeps unuploaded items in the count.
- Group by request_id returns one row per request; serializer fills zeroes.
- Filter by owner_id or resolved token before grouping.

**No N+1 on the List**

- The list endpoint groups the page's request ids in a single statement.
- A page of twenty requests costs two queries: the page itself, and the counts.
- Counting per request would be twenty-one queries for the same answer.
- Progress is never hydrated as a relation, so a lazy load cannot creep back in.

**Last Activity**

- Last activity is the newest uploaded_at; it can be null.
- It answers only is this current?
- No documents means no activity, not a 1970 date.
- It is not the ordering key; the cursor uses creation time.

**Progress Can Regress**

- Deleting a document lowers uploaded, so progress can go down.
- This is the honest result of deriving progress from current data.
- A stored counter would also need decrementing and could drift.
- Screens show the current value; progress is not assumed monotonic.
- A complete request can return to waiting.

**Reads Are Consistent Enough**

- Progress is counted with the request rows in one round trip.
- Uploads appear on the next read; no cache or event can go stale.
- No progress write exists, so nothing can silently drift.
- Two reads may differ because data can change between them.

**No Real-Time Channel**

- Pull-based; no websocket, subscription, or server push.
- Writer: upload. Readers: dashboard and portal.
- Refetch policy owned by respective screens.
- Open tabs may lag; last activity column indicates recency.

**Serialization**

- Payload includes uploaded, total, status, lastActivityAt as plain values.
- No percentage, float, or nested object.
- Ensures consistent numbers across clients.
- UI constructs labels/bars from these fields.

**Cost at Scale**

- Counts query reads item and document indexes; stays flat.
- Bounded by item cap (≤200 index rows per page).
- Negligible compared to file sniffing/object storage.

### Core Components

**ProgressCalculator** — Derive progress for one request or for a page of them.

- `forRequest(string $requestId): Progress`
- `forRequests(array $requestIds): array` — one grouped statement for the whole page
- `status(int $uploaded, int $total): string`

**ProgressQuery** — The single statement behind every count.

- `countsByRequest(array $requestIds): array` — keyed by request id, zero-filled
- `lastActivityByRequest(array $requestIds): array` — keyed by request id, empty:null

**ProgressSerializer** — Turn a `Progress` into the four payload fields.

- `fields(Progress $p): array`
- `percent(Progress $p): int` — computed here for display, never stored or sent

## Trade-offs

**Derived, Not Stored**

- Benefit: no drift, backfill, or migration.
- Cost: every read recomputes it.
- Stored progress rejected because upload, delete, and create must update it.

**Integers, Not Percentages**

- Benefit: no rounding differences between clients.
- Cost: each client computes its own display fraction.
- Percentage rejected as a second source of truth.

**Documents Only, No Item State**

- Benefit: one unambiguous definition of uploaded.
- Cost: deleted files return items to waiting.
- Per-item status rejected as duplicate state.

**Link State Kept Separate**

- Benefit: revoked links do not affect progress.
- Cost: two indicators.
- Combined status rejected as confusing.

**Pull, Not Push**

- Benefit: simple, no connections to maintain.
- Cost: open tabs can show stale progress.
- Push rejected as unnecessary complexity.

**Batched per Page, Not per Request**

- Benefit: fixed round trips per page.
- Cost: grouped query and keyed map.
- Lazy loading rejected due to N+1 risk.

**Activity Displayed, Not Sortable**

- Benefit: keeps one cursor key on creation time.
- Cost: cannot sort by activity.
- Activity sorting remains an open question.

## Security

**Scoped Counting**

- Counts use the same owner or token predicate as the request query.
- Batching only aggregates already-authorized rows.
- Progress reveals nothing beyond the caller’s request.

**No Authorization Signal**

- Progress never affects access decisions.
- Complete status grants no extra access.
- No endpoint exposes progress without its request.

**Nothing Stored Means Nothing Stale**

- No cached or denormalized progress can become stale.
- No stored value can mislead after policy changes.
- Null `lastActivityAt` remains null, never a fake date.

**Payload Hygiene**

- Progress contains no filenames, labels, or owner text.
- The portal receives progress only for its own request.
- No cross-client progress is exposed.

## Performance

- **Counts query** — one grouped LEFT JOIN per list page and per detail view.
- **Round trips** — two queries per list page: the page, then the counts.
- **Index use** — reads the item and document indexes; no sort and no scan.
- **Aggregation** — grouped over at most 10 requests per page, keeping the row small.
- **No cache** — nothing is invalidated, because nothing is stored.
- **Percent** — computed once, in the serializer, on two integers.
- **Null handling** — a request with no documents costs nothing extra.
- **Negligible share** — small compared with file sniffing, hashing, and object storage.

## Error Handling

| Condition          | Cause                | Behavior                          |
| ------------------ | -------------------- | --------------------------------- |
| Zero items         | Impossible           | No divide-by-zero.                |
| No document        | Not uploaded         | Counted as not uploaded.          |
| Document deleted   | Owner action         | Count drops; progress regresses.  |
| Orphan document    | Impossible (cascade) | Ignored by join.                  |
| Request deleted    | Row gone             | Disappears from list.             |
| Counts query fails | DB error             | Returns 500; no guess.            |
| Delete during read | Concurrent action    | Next read reflects current state. |

**Response Shape**

- uploaded, total, status, lastActivityAt included with request fields.
- status is waiting or complete.
- lastActivityAt is null if no uploads.
- Zero uploaded rendered as zero (not placeholder/error).

**Failure Policy**

- Failed counts query fails the whole request; no guess made.
- No fallback, cached value, or partial aggregation.
- Regressions not clamped.

## Testing

**Unit Tests**

- forRequest returns 0 of 1, 3 of 7, and 10 of 10.
- Status is complete only when uploaded equals total.
- Total is never zero, so no guard is written and none is needed.
- The serializer emits integers and no float, and status is one of two values.
- Percent rounds once: 1 of 3 is 33, 2 of 3 is 67, and 1 of 10 is 10.
- lastActivityAt is null with no documents and the newest upload otherwise.
- Deleting a document reduces the count on the very next call.

**Feature Tests**

- A new request reports zero uploaded and a total equal to the item count.
- Uploading one item raises uploaded by exactly one and leaves total unchanged.
- Uploading the last item flips status to complete within the same response.
- The list, the detail, and the portal report identical numbers for the same request.
- The grouped page counts match a per-request loop, request for request.
- A page of twenty requests issues exactly two queries.
- Deleting a request removes it from the list, so a zero-total row is never serialized.
- Deleting a document lowers progress on the next read.
- lastActivityAt is the newest upload, not the newest row of any kind.
- Revoking or expiring a link changes no progress value.
- Another owner's request never contributes a count to the caller's page.
- A deleted document's object is gone, and the count agrees with the storage listing.

**End-to-End Tests**

- Owner creates request; client uploads 3 of 5; owner sees 3 of 5.
- Client portal and owner dashboard show same counts.
- After final upload, both show complete on next read.
- Owner deletes document; progress drops on next read.

## Open Questions

**Progress Regression**

- Deleting a file drops progress and can make a completed request waiting.
- Open: warn on regression or stay silent?
- Option: Warn before deletion.
- Option: Stay silent.

**Ordering by Activity**

- Last activity is displayed but not sortable because the cursor uses creation time.
- Open: add activity-based paging or keep newest-first?
- Option: Keep newest-first.
- Option: Add an activity cursor and index.

**Replacing a File**

- A second upload returns 409; deleting first makes progress dip temporarily.
- Open: allow replacement in one action?
- Option: Keep delete then upload.
- Option: Add atomic file replacement.

**Rounding**

- Percentage is computed only for display.
- Open: floor, round, or show the fraction?
- Option: Round to nearest percent.
- Option: Show 3 of 7 only.

**Time to Complete**

- Progress shows how much is done, not how long it took.
- Open: add completion time?
- Option: Keep progress-only.
- Option: Store and expose a completion timestamp.

**Stale Numbers**

- Pull-based progress can lag behind client uploads.
- Open: show data age or leave it implicit?
- Option: Keep staleness implicit.
- Option: Show when progress was last refreshed.
