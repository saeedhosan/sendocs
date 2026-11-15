# 1K Concurrent Owner Scalability Validation

**Status:** Implementation added; first full load run pending  
**Target:** 1,000 concurrent owner sessions  
**Outcome:** The one-owner functional baseline passed; concurrent capacity has not yet been measured

## Goal

Exercise Sendocs' important application surfaces with up to 1,000 concurrent, independently authenticated owners using only GitHub Actions, Docker Compose, and local k6.

This is a bounded concurrency test, not a 1K DAU or 24-hour soak test. The application and load generator share a GitHub-hosted runner, so results describe that runner and this workload—not production-server capacity.

## Workload

Each owner VU has a separately seeded user and opaque session cookie. It performs a realistic mix of:

- Home shell: `GET /` and `GET /dashboard`
- Authentication: `GET /api/v1/auth/session`
- Owner dashboard data: `GET /api/v1/requests`
- Owner writes and detail: create one request, then `GET /api/v1/requests/{id}`
- Repeated reads with a 2–5 second think time

The load ramps through 100, 250, 500, and 1,000 concurrent owner VUs, then holds 1,000 for 30 seconds.

A small authentication burst also exercises the login and registration endpoints: 10 requests to each from the runner's shared source IP, matching their documented 10-per-minute IP limits.

### Client traffic and shared-IP limits

All API traffic passes through the single Compose web proxy. Laravel sees the same proxy source IP for every synthetic client, so Sendocs' per-IP limits apply to the combined workload:

| Endpoint | Application limit | Test workload |
|---|---:|---:|
| Portal read | 60/minute/IP | Up to 60 reads |
| Portal upload | 30/hour/IP | Up to 30 uploads |
| Owner login | 10/minute/IP | 10 logins |
| Owner registration | 10/minute/IP | 10 registrations |

The first 60 owner journeys open their own client portal; the first 30 also upload a small valid PDF. We preserve the real rate limits rather than disabling security controls or spoofing client addresses. Therefore, this single-runner test does **not** claim 1,000 simultaneous client portal reads or uploads.

## Test Environment

- Free GitHub-hosted runner; no external server or paid k6 service.
- Run the repository's Docker Compose stack, including PostgreSQL and private RustFS object storage.
- Use isolated synthetic accounts, sessions, requests, and files. Never load-test the public demo or production.
- k6 and the application share runner CPU and memory.
- Compose currently uses the repository's development targets; these measurements are not production-build benchmarks.
- Synthetic session credentials are temporary and excluded from uploaded artifacts; Compose volumes are removed after the run.

## Validation

1. [x] Add the one-owner functional journey and GitHub Actions workflow.
2. [x] Record concise benchmark history in [Benchmark](../benchmark.md).
3. [x] Seed independent synthetic owner accounts and session cookies without consuming the public registration/login IP budget.
4. [x] Implement progressive 100/250/500/1,000 owner stages.
5. [x] Exercise home, authentication, owner, client portal, and upload routes within the documented rate limits.
6. [ ] Verify the complete workflow on GitHub Actions and inspect the first 1,000-owner result.
7. [ ] Investigate bottlenecks and rerun after any changes.

## Reported Measurements

The benchmark history records:

- Concurrent owner target and maximum active VUs
- Total HTTP requests and average requests per second
- Average and p95 request latency
- HTTP error rate and dropped iterations
- Functional check pass rate and average journey duration
- Login, registration, portal-read, and upload counts
- GitHub runner CPU and memory

Raw k6 summary and failure logs remain downloadable workflow artifacts. The concise result is appended automatically to [Benchmark](../benchmark.md).

## Acceptance Criteria

- Reach the configured 1,000-owner stage.
- HTTP error rate below 1% for the defined workload.
- At least 99% of functional checks pass.
- No unexpected 401, 403, 404, 409, 410, or 429 responses in the normal journey.
- Report dropped iterations and runner resources; do not hide resource saturation.

These criteria describe this synthetic workload only. They are not a production SLO or a promise of 1,000-owner capacity on a different server.

## Historical Baseline

| Scenario | Outcome | Evidence |
|---|---|---|
| One-owner functional journey | Passed; one VU and one iteration | [GitHub Actions run](https://github.com/saeedhosan/sendocs/actions/runs/43748805973) |
| 100 concurrent owners | Pending | |
| 250 concurrent owners | Pending | |
| 500 concurrent owners | Pending | |
| 1,000 concurrent owners | Pending | |

## References

[Design](../design.md) · [Decisions](../decisions.md) · [OpenAPI](../../api/docs/openapi.yaml) · [k6](https://grafana.com/docs/k6/latest/)
