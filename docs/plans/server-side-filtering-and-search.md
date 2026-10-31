## Context

The owner dashboard (`ui/owner/owner_dashboard/code.html`) has status filter chips (All / Waiting / Complete with counts) and a search box. PR #57 implements these **client-side over the currently loaded page only**, because the list endpoint supports neither a status filter nor a search query.

That means filtering/searching ignores requests that have not been paged in yet, and the chip counts reflect only the loaded page.

## Task

Add server-side support and wire the dashboard to it:

- **API** - accept filter/search params on the owner requests list endpoint (e.g. `status=all|waiting|complete` and `q=`), and return matching cursor-paginated results.
- **Counts** - provide the per-status counts the chips display (All / Waiting / Complete) for the whole account, not just the loaded page.
- **Docs** - update `docs/owner-requests` (and the mirrored OpenAPI in `docs/openapi.yaml` + `api/docs/openapi.yaml`) since this surface is currently documented as out of scope.
- **Web** - switch `RequestFilters` from local `useMemo` filtering to query params; keep URL/state behavior consistent with the rest of the app.

## Acceptance

- Filtering and search return correct results across the full dataset, not just the loaded page.
- Chip counts match true totals.
- API + OpenAPI docs updated.

Refs: #57

Issues: #59
