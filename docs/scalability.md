# Scalability

This document defines how Sendocs tests application capacity. Benchmark results are recorded in [performance.md](./performance.md).

## Goal

Validate whether Sendocs can handle 2,000 concurrent virtual users (VUs), measure capacity beyond that target, and check for problems that appear under sustained load.

A VU is a simulated user running a k6 workflow. It is not the same as requests per second (RPS), registered accounts, or real-world users.

## Test profiles

| Test | Target | Steady period | Purpose |
| --- | ---: | ---: | --- |
| Baseline | 500 VUs | Short | Establish latency, throughput, errors, and resource use |
| Capacity | 2,000 VUs | 10–15 min | Validate the target under a representative workload |
| Headroom | 2,500–3,000 VUs | Record per run | Find the saturation point |
| Soak | 2,000 VUs | 30–60 min | Check for leaks and performance degradation over time |

Each test ramps up gradually before the steady period. The ramp time is additional to the steady period.

## Workloads

The load suite currently has four groups:

- **Landing:** public routes.
- **Authentication:** login and session resolution.
- **Owner:** authenticated owner operations.
- **Client:** magic-link portal and upload operations.

The GitHub Actions workflow currently runs these groups separately. These tests help isolate bottlenecks, but a 2,000-VU run in one group does not show that the application handles 2,000 users across all workflows.

To support an application-wide capacity claim, add a mixed-workload test that runs the groups against the same application stack. Its traffic distribution should reflect expected usage and be documented with the results.

Use realistic think time, separate test identities where needed, and keep account/data setup outside the measured test.

## Load profile

Use k6's `ramping-vus` executor for concurrency tests:

```js
executor: 'ramping-vus',
startVUs: 0,
stages: [
    { duration: '2m', target: Math.round(TARGET_VUS / 3) },
    { duration: '2m', target: Math.round((TARGET_VUS * 2) / 3) },
    { duration: '2m', target: TARGET_VUS },
    { duration: TEST_DURATION, target: TARGET_VUS },
],
gracefulRampDown: '30s',
gracefulStop: '30s',
```

At 2,000 VUs, the ramp reaches about 667 after two minutes, 1,333 after four minutes, and 2,000 after six minutes. The final stage holds that level for `TEST_DURATION`.

- Capacity test: set `TEST_DURATION` to 10–15 minutes.
- Soak test: set it to 30–60 minutes.
- Baseline and headroom: choose and record a steady period appropriate to the run.

`gracefulRampDown` gives VUs being stopped time to finish their current iteration. `gracefulStop` gives in-flight iterations time to finish when the scenario ends.

## What to measure

Record results by workload and, where possible, by endpoint:

- Throughput: requests per second and completed iterations per second.
- Latency: average, p95, and p99.
- Reliability: HTTP failure rate and business-check success rate.
- Resources: API, PostgreSQL, Redis, and Nginx CPU and memory.
- Database: connection use, slow queries, and locks.
- Stability: worker restarts, queue growth, and changes in latency or memory during the test.

Also monitor the k6 runner. If the load generator is saturated, the result does not establish application capacity.

## Pass criteria

Agree on endpoint latency objectives before treating a run as a pass. Initial reliability targets are:

- HTTP request failure rate below 1%.
- At least 99% success for expected business operations.
- No sustained resource saturation, connection exhaustion, OOM events, or unexplained memory growth.
- No material increase in errors or latency during the steady period.

These are proposed test gates, not measured production SLOs. Do not relax thresholds after a failed run just to make CI pass.

## CI and repeatability

Use the [k6 GitHub Actions workflow](../.github/workflows/k6-load.yml) to run the tests against the production images.

For each run, keep the commit SHA, workflow URL, runner specifications, image identifiers, k6 settings, workload mix, and test data details with the k6 summary, resource metrics, and relevant logs.

Run important profiles at least three times under the same conditions and report every result, not just the best one. Keep setup traffic out of the measured workload.

GitHub-hosted runners are useful for repeatable CI checks, but their resources can vary. Before making a production-capacity claim, repeat the test on infrastructure representative of the intended deployment.

## Capacity claims

A capacity claim must state the VU count, workload, test duration, environment, throughput, latency, failure rate, and resource use.

Do not claim that Sendocs supports 2,000 concurrent users based only on an isolated workload test, one short run, or a test where the load generator was saturated. Be clear that k6 VUs are simulated users, not a guarantee of the same number of real-world users.

Publish measured results in [performance.md](./performance.md).

## Open questions

- What workload mix best represents expected Sendocs usage?
- What latency objectives should apply to each endpoint?
- What production-like environment will be used to validate the capacity claim?
- Should mixed-workload testing be added alongside the existing workload matrix?
