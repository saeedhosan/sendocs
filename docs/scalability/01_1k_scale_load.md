# 1K Concurrent User Load Test

## Target

Measure Sendocs HTTP behavior with a configurable number of concurrent virtual users. The default is 100 VUs per workload group; 1,000 remains the scalability target.

## Parallel workload groups

The workflow runs four independent GitHub Actions matrix jobs in parallel. Each job starts its own Docker Compose application/database stack and runs the same k6 entry point for the configured duration (default: 60 seconds). The entry point dispatches to the workload selected by `WORKLOAD_GROUP`.

| Group | Workload module | Endpoints exercised |
| --- | --- | --- |
| Landing | `tests/load/workloads/landing.js` | `GET /` |
| Authentication | `tests/load/workloads/auth.js` | `POST /api/v1/auth/login`, `GET /api/v1/auth/session` |
| Owner portal | `tests/load/workloads/owner.js` | `GET /api/v1/requests`, `GET /api/v1/requests/{requestId}` |
| Client portal | `tests/load/workloads/client.js` | `POST /api/v1/portal/{token}/items/{itemId}/file`, `GET /api/v1/portal/{token}` |

Shared configuration lives in `tests/load/config.js`, and account/request setup helpers live in `tests/load/helpers/accounts.js`. Each workload owns its setup and request execution. The shared entry point, `tests/load/k6-load.js`, owns scenario configuration, workload dispatch, thresholds, and report generation.

Each authenticated VU receives its own benchmark account during setup. Owner and client groups also create one request per VU. This isolates user-keyed rate-limit buckets and avoids making all virtual users share one owner account. Each VU receives a unique synthetic client IP from the reserved `198.18.0.0/15` range. In the `testing` environment only, `ApplyBenchmarkClientIp` maps `X-Client-IP` to `REMOTE_ADDR`. `AppServiceProvider.php` and production rate-limit configuration are not modified for this benchmark.

The authentication group registers its accounts during setup, then measures one login per VU followed by repeated session reads. The client group uploads one small PDF per VU, then repeatedly reads that VU's portal. Upload is measured once per VU because each request item accepts only one file.

## Rate limits and pacing

The workload respects the API's configured per-user and per-IP limits:
- Authentication session and owner read requests are paced at approximately 0.55 seconds per VU, below the 120 requests/minute per-user limit.
- Client portal reads are paced at approximately 1.1 seconds per VU, below the 60 requests/minute per-IP limit.
- Each VU logs in once; each client item is uploaded once.
- Landing requests are not paced.

The pacing is intentional so the benchmark measures application behavior without turning expected rate-limit responses into artificial failures. It does not raise or bypass production limits.

## Environment and results

- Four GitHub-hosted runners execute in parallel. Each runner hosts its own app stack and k6 generator, so each result represents that runner's combined environment.
- Each workload produces a separate k6 summary and resource-usage log.
- A final aggregation job appends all available workload reports to `docs/benchmark.md` in one commit.
- One k6 entry point: `tests/load/k6-load.js`.
- Four workload modules under `tests/load/workloads/`.
- Shared configuration: `tests/load/config.js`; shared setup helpers: `tests/load/helpers/accounts.js`.
- One workflow: `.github/workflows/k6-loading.yml`.
- The previous mixed-workload and health-only results remain historical and are not directly comparable with these isolated workload results.
