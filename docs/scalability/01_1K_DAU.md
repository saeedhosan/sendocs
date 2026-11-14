# 1K DAU Scalability Validation

**Status:** In progress  
**Target:** 1,000 active owner accounts per day  
**Outcome:** Not started

## Goal

Test the Sendocs application and Docker Compose stack with a realistic, accelerated 1K-owner daily workload using GitHub Actions and open-source k6.

This validates the tested codebase on a GitHub-hosted runner, not production-server capacity.

## Workload

1K DAU means 1,000 distinct owners active in a 24-hour period. Client activity is additional traffic.

Initial workload estimates (hypotheses, not measured usage):

| Metric | Daily estimate |
|---|---:|
| API requests | 10,000 |
| Requests created | 200 |
| Successful uploads | 500 |
| Average upload | 5 MB |

Simulate owner and client journeys with varied request sizes, upload sizes, think times, and returning clients. Do not generate artificial traffic just to hit these estimates. Keep failure and duplicate-upload tests separate.

## Test Environment

- GitHub-hosted runner; no external server or paid load-testing service.
- Build and run the repository's Docker Compose stack, including PostgreSQL and private object storage.
- Use isolated synthetic data; never load-test the public demo or production.
- Record the commit, runner resources, test duration, and k6 results.

The app and k6 share runner resources, so document this limitation with every result.

## Validation

1. [x] Add a k6 journey test: owner registration, request list/create/detail, portal lookup, and PDF upload.
2. [x] Add a separate manual [Scalability Load Test workflow](../../.github/workflows/k6-loading.yml).
3. [ ] Run the k6 journey test and fix journey or environment failures.
4. [ ] Add isolated synthetic data for 1,000 owners.
5. [ ] Run progressively at 100, 250, 500, and 1,000 daily active owners.
6. [ ] Run accelerated daily, peak, upload, and bounded soak scenarios.
7. [ ] Record bottlenecks and rerun after changes.

The k6 script is [tests/load/k6-load.js](../../tests/load/k6-load.js). An accelerated daily test is not a real 24-hour soak.

## Acceptance Targets

| Measurement | Initial target |
|---|---:|
| Request list (1,000 requests) | p95 < 200 ms |
| Portal lookup | p95 < 150 ms |
| 5 MB upload (excluding network) | < 3 s |
| Normal-workload error rate | < 1% |

Also verify owner isolation, invalid-link 410 behavior, duplicate-upload handling, private file access, progress, and storage cleanup. These are targets, not achieved results.

## Results

| Daily active owners | Outcome | Evidence |
|---:|---|---|
| 100 | Not run | |
| 250 | Not run | |
| 500 | Not run | |
| 1,000 | Not run | |

For each run, attach k6 output and record latency, throughput, errors, resource usage, database behavior, storage performance, and queue delay.

## Findings

Record measured bottlenecks, evidence, changes, and the effect of each change. Add infrastructure only when measurements justify it.

## References

[Design](../design.md) · [Development](../development.md) · [Decisions](../decisions.md) · [OpenAPI](../../api/docs/openapi.yaml) · [k6](https://grafana.com/docs/k6/latest/)
