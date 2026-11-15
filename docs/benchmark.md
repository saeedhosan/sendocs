# Benchmark

Sendocs scalability benchmark history. GitHub Actions generates each dated result from k6's `handleSummary()`, displays it in the workflow Job Summary, and appends it here.

<!-- benchmark-run: 43751646078 -->
### Results — 2026-11-15T19:21:56.741Z

**Outcome:** Passed  
**Scenario:** Functional baseline  
**DAU target:** Not tested  
**Workload:** 1 owner completing one request and one client upload  
**Commit:** [`8cf1afc`](https://github.com/saeedhosan/sendocs/commit/8cf1afc936b0a5bf8dfd0b6a1866c01d79ecc070) · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43751646078)

| Metric | Result |
|---|---:|
| HTTP requests | 6 |
| Iterations | 1 |
| Average latency | 97.8 ms |
| p95 latency | 277.1 ms |
| HTTP error rate | 0.00% |
| Functional checks | 10/10 (100.0%) |
| Average journey duration | 589.9 ms |

**Runner:** Linux/X64 · 4 vCPU · 15.6 GB RAM

> Results describe this workload on a shared GitHub-hosted runner. A functional baseline is not evidence of DAU capacity or production-server capacity.
