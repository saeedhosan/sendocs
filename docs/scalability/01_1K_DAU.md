# 1K DAU Scalability Validation

**Status:** Planned  
**Target:** 1,000 active owner accounts per day

## Goal

Measure whether one Sendocs application instance can support 1K owner DAU and the client traffic they generate.

## Workload

1K DAU means 1,000 distinct owners active within 24 hours. Client activity is additional traffic.

Initial design estimates (hypotheses, not measured usage):

| Metric | Daily target |
|---|---:|
| Active owners | 1,000 |
| API requests | ~10,000 |
| Requests created | ~200 |
| Successful uploads | ~500 |
| Average upload size | ~5 MB |
| Upload volume | ~2.5 GB |

Simulate real owner and client journeys, not isolated endpoint calls:

- Owners sign in, view lists, open request details, create requests, and download files.
- Clients open magic links, upload files, leave, and return later.
- Include varied item counts (1–10), file sizes (up to 25 MB), and normal think time.
- Keep retries, duplicate uploads, invalid files, and destructive actions as separate tests.

The request and upload totals above are planning assumptions. Validate the journey mix during testing; do not add artificial requests just to reach 10,000/day.

## Test Environment

Use one application instance, PostgreSQL, private S3-compatible storage, the email worker, and cleanup scheduler.

Record the tested commit, machine/container limits, database and storage configuration, dataset, and load-generator location. Use an isolated environment with synthetic data.

## Test Steps

1. Verify each owner and client journey with a small smoke test.
2. Increase owner population progressively: 100, 250, 500, then 1,000 DAU.
3. Run a full 24-hour 1K test to validate daily activity and scheduled cleanup.
4. Run separate upload, peak-load, soak, and failure tests.
5. Repeat any run that shows a bottleneck.

Use k6 for load generation. Do not run load tests against production without explicit authorization.

## Pass Criteria

| Measurement | Target |
|---|---:|
| Request list (1,000 requests) | p95 < 200 ms |
| Portal lookup | p95 < 150 ms |
| 5 MB upload | < 3 s, excluding network |
| Normal-workload error rate | < 1% |
| Peak API throughput | ~1 request/s |

Also verify owner isolation, identical 410 responses for invalid links, one file per item, private file access, correct progress, and eventual storage cleanup.

## Results

**Outcome:** Not started

| Level | Result | Notes |
|---|---|---|
| 100 DAU | Not run | |
| 250 DAU | Not run | |
| 500 DAU | Not run | |
| 1K DAU | Not run | |

For each run, record throughput, p50/p95/p99 latency, errors, CPU/memory, database connections/queries/locks, storage transfer performance, queue delay, and cleanup backlog.

## Findings

Record only measured bottlenecks, the evidence, the change made, and its result. Add infrastructure only when measurements justify it.

## References

[Design](../design.md) · [Decisions](../decisions.md) · [OpenAPI](../../api/docs/openapi.yaml) · [Owner dashboard](../features/owner-dashboard.md) · [Client portal](../features/client-portal.md)
