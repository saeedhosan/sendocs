# Sendocs — Scalability Benchmarks

This file records automated load-test results. Each entry describes the exact test scenario; results from different scenarios are not directly comparable.

### Scalability Test - 2026-11-16

- **Result:** Failed
- **Load target:** 1000 concurrent HTTP VUs
- **Test scenario:** Repeated HTTP requests to the Sendocs health endpoint.
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43845302910) · [Commit](https://github.com/saeedhosan/sendocs/commit/6cd3a7365da7172b158dbd57db7a3a0afc1614c0)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 1000 |
| Peak virtual users | 1000 |
| Total HTTP requests | 11828 |
| Request rate | 140.43 req/s |
| Request latency (average) | 4332.29 ms |
| Request latency (p95) | 28555.74 ms |
| Request failure rate | 5.99% |
| Successful health checks | 94.01% |
| Test duration | 84.2s |
