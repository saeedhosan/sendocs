# Sendocs — Scalability Benchmarks

This file records automated load-test results. Each entry describes the exact test scenario; results from different scenarios are not directly comparable.


\n### Scalability Test - 2026-11-16

- **Result:** Failed
- **Load target:** 1000 concurrent HTTP VUs
- **Test scenario:** Repeated HTTP requests to the Sendocs health endpoint.
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43841320734) · [Commit](https://github.com/saeedhosan/sendocs/commit/9778792383348adfe41f0e1cc0c18af01eafe80a)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 1000 |
| Peak virtual users | 1000 |
| Total HTTP requests | 12253 |
| Request rate | 147.41 req/s |
| Request latency (average) | 4195.05 ms |
| Request latency (p95) | 30780.86 ms |
| Request failure rate | 5.42% |
| Successful health checks | 94.58% |
| Test duration | 83.1s |
