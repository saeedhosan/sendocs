# 1K Concurrent User Load Test

## Target

Measure Sendocs HTTP behavior with a configurable number of concurrent virtual users. The default is 100 VUs; 1,000 remains the scalability target.

## Workload

The single k6 script, `tests/load/k6-load.js`, exercises these real application surfaces:

1. **Home:** `GET /` serves the web application.
2. **Authentication and user:** `GET /api/v1/auth/session` resolves the authenticated user and session.
3. **Owner dashboard:** `GET /api/v1/requests` lists the owner's requests.
4. **Owner detail:** `GET /api/v1/requests/{requestId}` reads a real request and its items.
5. **Client portal:** `GET /api/v1/portal/{token}` reads a real magic-link portal.

The setup logs in once with the seeded demo account and creates one temporary request for owner-detail and portal reads. Teardown deletes that temporary request. The API has no separate public user-profile read endpoint; the session response includes the user.

The benchmark does not repeatedly register or log in each VU. Setup signs in once, creates one temporary request, and performs one client upload smoke check. Concurrent VUs send a unique `X-Client-IP` from the reserved `198.18.0.0/15` range. In the `testing` environment only, the middleware maps that header to `REMOTE_ADDR`, and rate-limit buckets use the per-VU IP with an elevated ceiling. Production rate-limit keys and limits remain unchanged.

## Duration and Rate Limits

- Default VUs: 100; the workflow input remains configurable.
- Default duration: `0`, meaning k6 runs until manually cancelled or the GitHub Actions job timeout is reached.
- GitHub Actions job timeout: 30 minutes, including image build, migrations, startup, and the load test.
- Each VU sends requests continuously without artificial sleep or pacing.
- The testing-only rate-limit override isolates each VU, including endpoints that normally key limits by owner ID. Requests without `X-Client-IP` retain their normal configured limits.

## Environment

- GitHub-hosted free runner and Docker Compose. The app stack and k6 generator share the runner, so results represent the combined environment.
- One k6 script: `tests/load/k6-load.js`.
- One workflow: `.github/workflows/k6-loading.yml`.
- Results: [Benchmark](../benchmark.md).

## Results

The workflow records total requests, throughput, average and p95 latency, failure rate, per-surface success rates, peak VUs, and runner/container resource usage. Results from the previous health-only test are historical and are not directly comparable with this endpoint-mix workload.
