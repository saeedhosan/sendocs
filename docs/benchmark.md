# Sendocs - Scalability Benchmarks

Automated performance test results from GitHub Actions.s

\n### Scalability Test - 2026-11-16\n\n- **Result:** Failed\n- **Load target:** 1 API VUs + 5 Chromium sessions\n- **Test machine:** GitHub Actions · 4 vCPU · 15.6\n GB RAM\n- **Test scenario:** Concurrent health checks plus complete browser journeys.\n- **User journey:** Registration → Dashboard → Create request → Client document upload.\n- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43837508109) · [Commit](https://github.com/saeedhosan/sendocs/commit/ad6a6d63026f0e0d970d34e69b349bda46c5edab)\n\n| Metric | Result |\n| -------------------------------- | --------: |\n| API virtual users (target) | 1 |\n| API health requests | 58 |\n| API health request latency (p95) | 28.13 ms |\n| API health request failure rate | 0.00% |\n| Completed browser journeys | 0 / 5 |\n| Browser request latency (p95) | 236.76 ms |\n| Browser request failure rate | 1.94% |\n| End-to-end journey latency (p95) | — |\n| Functional checks | 71.1% |\n| Test duration | 60.1s |\n\n### Scalability Test - 2026-11-16

- **Result:** Failed
- **Load target:** 1000 concurrent HTTP VUs
- **Test scenario:** Repeated HTTP requests to the Sendocs health endpoint.
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43839034893) · [Commit](https://github.com/saeedhosan/sendocs/commit/aae68463f3131d1f804eb68c2dc5b76dada5cdd9)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 1000 |
| Peak virtual users | 1000 |
| Total HTTP requests | 11497 |
| Request rate | 135.87 req/s |
| Request latency (average) | 4447.77 ms |
| Request latency (p95) | 29946.63 ms |
| Request failure rate | 4.88% |
| Successful health checks | 95.12% |
| Test duration | 84.6s |
