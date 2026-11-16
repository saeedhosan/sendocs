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

The benchmark does not repeatedly register or log in each VU: authentication is limited to 10 requests per minute per IP. It also does not load-test file uploads in this mixed read workload: uploads are limited to 30 per hour per IP and each request item accepts only one file. These limits must not be bypassed by spoofing IP addresses.

## Duration and Rate Limits

- Default VUs: 100; the workflow input remains configurable.
- Default duration: `0`, meaning k6 runs until manually cancelled or the GitHub Actions job timeout is reached.
- GitHub Actions job timeout: 30 minutes, including image build, migrations, startup, and the load test.
- VUs are staggered and paced to keep the shared demo owner's user-level reads and the shared runner IP's portal reads within documented limits.
- Raising VUs increases the pacing interval; it does not create more test accounts or bypass rate limits.

## Environment

- GitHub-hosted free runner and Docker Compose. The app stack and k6 generator share the runner, so results represent the combined environment.
- One k6 script: `tests/load/k6-load.js`.
- One workflow: `.github/workflows/k6-loading.yml`.
- Results: [Benchmark](../benchmark.md).

## Results

The workflow records total requests, throughput, average and p95 latency, failure rate, per-surface success rates, peak VUs, and runner/container resource usage. Results from the previous health-only test are historical and are not directly comparable with this endpoint-mix workload.
