# 1K DAU Scalability Validation

**Status:** In progress  
**Target:** 1,000 active owner accounts per day  
**Outcome:** Journey verified; load capacity not tested

## Goal

Validate Sendocs with a realistic, accelerated 1K-owner daily workload using GitHub Actions and k6.

This measures the tested codebase on a GitHub-hosted runner, not production-server capacity.

## Workload

1K DAU means 1,000 distinct owners active in a 24-hour period. Client activity is additional traffic.

Initial estimates (hypotheses, not measured usage):

| Metric | Daily estimate |
|---|---:|
| API requests | 10,000 |
| Requests created | 200 |
| Successful uploads | 500 |
| Average upload | 5 MB |

Model owner and client journeys with varied request sizes, upload sizes, think times, and returning clients. Keep failure and duplicate-upload tests separate from normal usage.

## Test Environment

- GitHub-hosted runner; no external server or paid load-testing service.
- Run the repository's Docker Compose stack, including PostgreSQL and private object storage.
- Use isolated synthetic data; never load-test the public demo or production.
- Record the commit, runner resources, k6 summary, and container resources before and after the test.

The app and k6 share runner resources. Results describe this runner and workload only.

## Validation

1. [x] Add the owner/client journey: registration, request list/create/detail, portal lookup, and PDF upload.
2. [x] Add the [Scalability Load Test workflow](../../.github/workflows/k6-loading.yml).
3. [x] Run the journey successfully on GitHub Actions.
4. [ ] Add isolated synthetic data for 1,000 owners.
5. [ ] Run progressively at 100, 250, 500, and 1,000 daily active owners.
6. [ ] Run accelerated daily, peak, upload, and bounded soak scenarios.
7. [ ] Record bottlenecks and rerun after changes.

The k6 script is [tests/load/k6-load.js](../../tests/load/k6-load.js). An accelerated daily test is not a real 24-hour soak.

## Initial Acceptance Targets

| Measurement | Target |
|---|---:|
| Request list (1,000 requests) | p95 < 200 ms |
| Portal lookup | p95 < 150 ms |
| 5 MB upload (excluding network) | < 3 s |
| Normal-workload error rate | < 1% |

Also verify owner isolation, invalid-link 410 behavior, duplicate-upload handling, private file access, progress, and storage cleanup.

## Results

| Daily active owners | Outcome | Evidence |
|---:|---|---|
| Journey baseline | Passed; one VU, one iteration | [GitHub Actions run](https://github.com/saeedhosan/sendocs/actions/runs/43628352337) |
| 100 | Not run | |
| 250 | Not run | |
| 500 | Not run | |
| 1,000 | Not run | |

For load runs, retain the k6 summary and compare pre-test with post-test container resource snapshots. Investigate database, storage, or queue behavior when measurements or failures point to them.

## References

[Design](../design.md) · [Decisions](../decisions.md) · [OpenAPI](../../api/docs/openapi.yaml) · [k6](https://grafana.com/docs/k6/latest/)
