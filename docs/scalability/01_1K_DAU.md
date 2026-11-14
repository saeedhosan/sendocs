# 1K DAU Scalability Validation

**Status:** In progress  
**Target:** 1,000 active owner accounts per day

## Goal

Validate the Sendocs codebase and Docker Compose environment under a simulated 1K-owner daily workload, using only GitHub Actions and open-source k6.

This is a CI-based capacity experiment, not proof of capacity on a specific production server.

## Workload

1K DAU means 1,000 distinct owners active within a 24-hour period. Client activity adds traffic but does not count toward owner DAU.

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
- Vary request item counts (1–10), file sizes (up to 25 MB), and think time.
- Keep retries, duplicate uploads, invalid files, and destructive actions as separate tests.

The estimates are hypotheses. Validate the journey mix during testing; do not add artificial requests just to reach a target total.

## Test Environment

Run entirely in GitHub Actions:

- Check out the tested commit and build the repository's actual Docker Compose services.
- Start the application, PostgreSQL, and configured private object storage and workers.
- Apply migrations and create isolated synthetic benchmark data (including 1,000 distinct owners).
- Run k6 against the Compose application; do not send load to the public demo or production.
- Save k6 output, logs, and available resource measurements as workflow artifacts.

Use GitHub-hosted runner capacity and included Actions allowance only; do not provision a paid server or external load-testing service. Record runner specifications, job duration, container limits, and the tested commit for each run.

The application and load generator may compete for the same runner CPU and memory. Results therefore describe this CI environment and must not be presented as production-server capacity.

## Test Steps

1. [x] Add a k6 smoke journey covering owner registration, request listing/creation/detail, client portal lookup, and a valid PDF upload.
2. [x] Add the k6 smoke job to the existing manually dispatchable Build workflow. It builds every Compose image and starts the complete runtime stack, including the web frontend, API, PostgreSQL, RustFS, workers, scheduler, and storage initialization. One-shot test and migration helpers are excluded from stack startup; migrations run explicitly before startup.
3. Run the smoke workflow and fix any environment or journey failures before adding higher-volume scenarios.
3. Seed isolated synthetic owners, requests, items, and test files.
4. Increase simulated daily owner populations progressively: 100, 250, 500, then 1,000.
5. Run an accelerated workload representing a 24-hour activity distribution. Record the simulated time window and test duration; do not claim it was a real 24-hour soak.
6. Run separate upload, peak-load, soak (within CI job limits), and failure tests.
7. Repeat runs after addressing measured bottlenecks.

Use open-source k6 for load generation. Keep workflow runs manually triggered initially to control GitHub Actions usage. The smoke job lives in the existing [Build workflow](../../.github/workflows/build.yml) and runs on manual dispatch; its journey is [smoke.js](../../tests/load/smoke.js).

## Pass Criteria

| Measurement | Target |
|---|---:|
| Request list (1,000 requests) | p95 < 200 ms |
| Portal lookup | p95 < 150 ms |
| 5 MB upload | < 3 s, excluding network |
| Normal-workload error rate | < 1% |
| Peak API throughput | ~1 request/s |

Also verify owner isolation, identical 410 responses for invalid links, one file per item, private file access, correct progress, and eventual storage cleanup.

These are initial targets from the design, not measured results. Report each target as passed, failed, or not measured.

## Results

**Outcome:** Not started

| Level | Result | Notes |
|---|---|---|
| 100 DAU | Not run | |
| 250 DAU | Not run | |
| 500 DAU | Not run | |
| 1K DAU | Not run | |

For each run, record throughput, p50/p95/p99 latency, errors, CPU/memory, database connections/queries/locks, storage transfer performance, queue delay, cleanup backlog, runner specifications, and duration.

## Findings

Record only measured bottlenecks, supporting evidence, the change made, and its result. Add infrastructure only when measurements justify it.

## References

[Design](../design.md) · [Development and Docker Compose](../development.md) · [Decisions](../decisions.md) · [OpenAPI](../../api/docs/openapi.yaml) · [Owner dashboard](../features/owner-dashboard.md) · [Client portal](../features/client-portal.md) · [k6](https://grafana.com/docs/k6/latest/)
