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

### Scalability Test - 2026-11-16 (auth)

- **Result:** Passed
- **Workload group:** auth
- **Load target:** 100 concurrent HTTP VUs
- **Duration policy:** 60s
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43873735495) · [Commit](https://github.com/saeedhosan/sendocs/commit/15fe202ebe7611f1161a57e01cb94399d6e5f5d0)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 100 |
| Peak virtual users | 100 |
| Total HTTP requests (including setup) | 1671 |
| Request rate | 18.92 req/s |
| Request latency (average) | 3191.86 ms |
| Request latency (p95) | 15137.00 ms |
| Request failure rate | 0.00% |
| Login success | 100.00% |
| Session success | 100.00% |
| Actual test duration | 88.3s |
### Scalability Test - 2026-11-16 (client)

- **Result:** Passed
- **Workload group:** client
- **Load target:** 100 concurrent HTTP VUs
- **Duration policy:** 60s
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43873735495) · [Commit](https://github.com/saeedhosan/sendocs/commit/15fe202ebe7611f1161a57e01cb94399d6e5f5d0)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 100 |
| Peak virtual users | 100 |
| Total HTTP requests (including setup) | 2784 |
| Request rate | 31.37 req/s |
| Request latency (average) | 1222.96 ms |
| Request latency (p95) | 2755.89 ms |
| Request failure rate | 0.00% |
| Client upload success | 100.00% |
| Client portal success | 100.00% |
| Actual test duration | 88.7s |
### Scalability Test - 2026-11-16 (landing)

- **Result:** Passed
- **Workload group:** landing
- **Load target:** 100 concurrent HTTP VUs
- **Duration policy:** 60s
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43873735495) · [Commit](https://github.com/saeedhosan/sendocs/commit/15fe202ebe7611f1161a57e01cb94399d6e5f5d0)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 100 |
| Peak virtual users | 100 |
| Total HTTP requests (including setup) | 583580 |
| Request rate | 9724.82 req/s |
| Request latency (average) | 10.24 ms |
| Request latency (p95) | 14.21 ms |
| Request failure rate | 0.00% |
| Landing success | 100.00% |
| Actual test duration | 60.0s |
### Scalability Test - 2026-11-16 (owner)

- **Result:** Passed
- **Workload group:** owner
- **Load target:** 100 concurrent HTTP VUs
- **Duration policy:** 60s
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43873735495) · [Commit](https://github.com/saeedhosan/sendocs/commit/15fe202ebe7611f1161a57e01cb94399d6e5f5d0)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 100 |
| Peak virtual users | 100 |
| Total HTTP requests (including setup) | 3392 |
| Request rate | 39.12 req/s |
| Request latency (average) | 1286.42 ms |
| Request latency (p95) | 1424.23 ms |
| Request failure rate | 0.00% |
| Owner request-list success | 100.00% |
| Owner request-detail success | 100.00% |
| Actual test duration | 86.7s |
