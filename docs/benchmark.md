# Sendocs — Scalability Benchmarks

This file records automated load-test results. Each entry describes the exact test scenario; results from different scenarios are not directly comparable.



### Scalability Test — 2026-11-16T14:10:57.096Z

**Workload:** Authentication

- **Result:** Passed
- **Target load:** 100 concurrent HTTP VUs · 60 seconds
- **Environment:** GitHub Actions runner (application + k6)
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43882154747) · [Commit](https://github.com/saeedhosan/sendocs/commit/620b318c0db4c0f795ab9c7b857b94a804e8bccd)

| Metric | Result |
|---|---:|
| Peak virtual users | 100 |
| Total HTTP requests | 2221 |
| Throughput | 27.01 req/s |
| Average response time | 2254.24 ms |
| p95 response time | 9273.49 ms |
| HTTP failure rate | 0.00% |
### Scalability Test — 2026-11-16T14:11:55.368Z

**Workload:** Client portal

- **Result:** Passed
- **Target load:** 100 concurrent HTTP VUs · 60 seconds
- **Environment:** GitHub Actions runner (application + k6)
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43882154747) · [Commit](https://github.com/saeedhosan/sendocs/commit/620b318c0db4c0f795ab9c7b857b94a804e8bccd)

| Metric | Result |
|---|---:|
| Peak virtual users | 100 |
| Total HTTP requests | 2193 |
| Throughput | 23.35 req/s |
| Average response time | 1864.84 ms |
| p95 response time | 3366.51 ms |
| HTTP failure rate | 0.00% |
### Scalability Test — 2026-11-16T14:11:15.737Z

**Workload:** Landing

- **Result:** Passed
- **Target load:** 100 concurrent HTTP VUs · 60 seconds
- **Environment:** GitHub Actions runner (application + k6)
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43882154747) · [Commit](https://github.com/saeedhosan/sendocs/commit/620b318c0db4c0f795ab9c7b857b94a804e8bccd)

| Metric | Result |
|---|---:|
| Peak virtual users | 100 |
| Total HTTP requests | 306140 |
| Throughput | 5100.99 req/s |
| Average response time | 19.51 ms |
| p95 response time | 25.22 ms |
| HTTP failure rate | 0.00% |
### Scalability Test — 2026-11-16T14:10:38.466Z

**Workload:** Owner portal

- **Result:** Passed
- **Target load:** 100 concurrent HTTP VUs · 60 seconds
- **Environment:** GitHub Actions runner (application + k6)
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43882154747) · [Commit](https://github.com/saeedhosan/sendocs/commit/620b318c0db4c0f795ab9c7b857b94a804e8bccd)

| Metric | Result |
|---|---:|
| Peak virtual users | 100 |
| Total HTTP requests | 3419 |
| Throughput | 39.54 req/s |
| Average response time | 1269.83 ms |
| p95 response time | 1427.95 ms |
| HTTP failure rate | 0.00% |
