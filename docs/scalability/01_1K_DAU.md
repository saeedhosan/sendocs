# 1K DAU Scalability Validation

**Status:** In progress  
**Target:** 1,000 active owner accounts per day  
**Outcome:** Functional journey verified; load capacity not tested

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
- The app and k6 share runner resources; results describe this runner and workload only.

## Validation

1. [x] Add the owner/client journey: registration, request list/create/detail, portal lookup, and PDF upload.
2. [x] Add the [Scalability Load Test workflow](../../.github/workflows/k6-loading.yml).
3. [x] Run the journey successfully on GitHub Actions.
4. [x] Append a concise, dated benchmark result to [Benchmark](../benchmark.md) automatically from each k6 run.
5. [ ] Add isolated synthetic data for 1,000 owners.
6. [ ] Run progressively at 100, 250, 500, and 1,000 daily active owners.
7. [ ] Run accelerated daily, peak, upload, and bounded soak scenarios.
8. [ ] Record bottlenecks and rerun after changes.

The k6 `handleSummary()` function publishes each result to the GitHub Actions Job Summary and appends it to [Benchmark](../benchmark.md), preserving history in version control. The raw `k6-summary.json` remains a downloadable artifact. An accelerated daily test is not a real 24-hour soak.

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
| Journey baseline | One VU, one iteration | [GitHub Actions run](https://github.com/saeedhosan/sendocs/actions/runs/43628352337) |
| 100 | Not run | |
| 250 | Not run | |
| 500 | Not run | |
| 1,000 | Not run | |

## References

[Design](../design.md) · [Decisions](../decisions.md) · [OpenAPI](../../api/docs/openapi.yaml) · [k6](https://grafana.com/docs/k6/latest/)
