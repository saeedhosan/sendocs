# Sendocs — Scalability Benchmarks

This file records automated load-test results. Each entry describes the exact test scenario; results from different scenarios are not directly comparable.

### Scalability Test - 2026-11-16 (auth)

- **Result:** Passed
- **Workload group:** auth
- **Load target:** 100 concurrent HTTP VUs
- **Duration policy:** 60s
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43876044692) · [Commit](https://github.com/saeedhosan/sendocs/commit/8636c91c2403538439167bbda8e2d72853b7da7b)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 100 |
| Peak virtual users | 100 |
| Total HTTP requests (including setup) | 1571 |
| Request rate | 17.61 req/s |
| Request latency (average) | 3436.74 ms |
| Request latency (p95) | 16119.30 ms |
| Request failure rate | 0.00% |
| Login success | 100.00% |
| Session success | 100.00% |
| Actual test duration | 89.2s |
### Scalability Test - 2026-11-16 (client)

- **Result:** Passed
- **Workload group:** client
- **Load target:** 100 concurrent HTTP VUs
- **Duration policy:** 60s
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43876044692) · [Commit](https://github.com/saeedhosan/sendocs/commit/8636c91c2403538439167bbda8e2d72853b7da7b)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 100 |
| Peak virtual users | 100 |
| Total HTTP requests (including setup) | 2317 |
| Request rate | 24.77 req/s |
| Request latency (average) | 1703.39 ms |
| Request latency (p95) | 3205.60 ms |
| Request failure rate | 0.00% |
| Client upload success | 100.00% |
| Client portal success | 100.00% |
| Actual test duration | 93.5s |
### Scalability Test - 2026-11-16 (landing)

- **Result:** Passed
- **Workload group:** landing
- **Load target:** 100 concurrent HTTP VUs
- **Duration policy:** 60s
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43876044692) · [Commit](https://github.com/saeedhosan/sendocs/commit/8636c91c2403538439167bbda8e2d72853b7da7b)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 100 |
| Peak virtual users | 100 |
| Total HTTP requests (including setup) | 327656 |
| Request rate | 5459.18 req/s |
| Request latency (average) | 18.23 ms |
| Request latency (p95) | 22.46 ms |
| Request failure rate | 0.00% |
| Landing success | 100.00% |
| Actual test duration | 60.0s |
### Scalability Test - 2026-11-16 (owner)

- **Result:** Passed
- **Workload group:** owner
- **Load target:** 100 concurrent HTTP VUs
- **Duration policy:** 60s
- **Evidence:** [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43876044692) · [Commit](https://github.com/saeedhosan/sendocs/commit/8636c91c2403538439167bbda8e2d72853b7da7b)

| Metric | Result |
| -------------------------------- | --------: |
| Target virtual users | 100 |
| Peak virtual users | 100 |
| Total HTTP requests (including setup) | 2057 |
| Request rate | 21.84 req/s |
| Request latency (average) | 2517.14 ms |
| Request latency (p95) | 2961.92 ms |
| Request failure rate | 0.00% |
| Owner request-list success | 100.00% |
| Owner request-detail success | 100.00% |
| Actual test duration | 94.2s |
