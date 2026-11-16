# Sendocs — Scalability Benchmarks

This file records automated load-test results. Each entry describes the exact test scenario; results from different scenarios are not directly comparable.

## Test environment and limitations

- Tests run on GitHub Actions `ubuntu-latest`.
- The Sendocs application stack and k6 load generator run on the same runner. CPU and memory contention can affect results.
- These measurements describe this combined CI environment, not the standalone capacity of a production server.
- HTTP virtual users (VUs) are simulated clients repeatedly making requests. They are not equivalent to authenticated users completing real workflows.

## Historical browser journey test — 2026-11-16

**Result: Failed**

This was an earlier browser-based experiment and is retained for history. It is not part of the current HTTP-only scalability benchmark.

- **Load target:** 1 API VU and 5 Chromium sessions.
- **Scenario:** Concurrent health checks and browser journeys covering registration, dashboard, request creation, and client document upload.
- **Workflow:** [Run 43837508109](https://github.com/saeedhosan/sendocs/actions/runs/43837508109)
- **Commit:** [ad6a6d6](https://github.com/saeedhosan/sendocs/commit/ad6a6d63026f0e0d970d34e69b349bda46c5edab)

| Metric | Result |
| --- | ---: |
| API virtual users | 1 |
| API health requests | 58 |
| API health request latency (p95) | 28.13 ms |
| API health request failure rate | 0.00% |
| Completed browser journeys | 0 / 5 |
| Browser request latency (p95) | 236.76 ms |
| Browser request failure rate | 1.94% |
| End-to-end journey latency (p95) | Not available |
| Functional checks | 71.1% |
| Test duration | 60.1 s |

## HTTP health-endpoint load test — 2026-11-16

**Result: Failed**

- **Load target:** 1,000 concurrent HTTP VUs.
- **Scenario:** Each VU repeatedly sends `GET /health` requests during the test.
- **Configured duration:** 60 seconds.
- **Workflow:** [Run 43839034893](https://github.com/saeedhosan/sendocs/actions/runs/43839034893)
- **Commit:** [aae6846](https://github.com/saeedhosan/sendocs/commit/aae68463f3131d1f804eb68c2dc5b76dada5cdd9)

| Metric | Result |
| --- | ---: |
| Target virtual users | 1,000 |
| Peak virtual users | 1,000 |
| Total HTTP requests | 11,497 |
| Request rate | 135.87 req/s |
| Average request latency | 4,447.77 ms |
| p95 request latency | 29,946.63 ms |
| Request failure rate | 4.88% |
| Successful health checks | 95.12% |
| Reported test duration | 84.6 s |

**Why it failed:** The test exceeded its configured thresholds: request failures were above 1%, and successful health checks were below 99%. The job logs show repeated request timeouts. The run reached 1,000 VUs, but it did not sustain that load within the required latency/reliability thresholds.

**Interpretation:** This result shows that the combined GitHub Actions test environment did not pass the 1,000-VU health-endpoint test. It does not establish Sendocs' standalone production capacity or prove which component caused the bottleneck.
