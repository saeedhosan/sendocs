# Scalability

This document describes how we test Sendocs under load and what evidence we need before making capacity claims. Test results are recorded in [performance.md](./performance.md).

## Goals

- Establish a baseline.
- Validate 2,000 concurrent virtual users (VUs).
- Measure headroom beyond 2,000 VUs.
- Check stability during sustained load.

A k6 VU represents a simulated user running a workflow. It does not mean one request per second or guarantee the same number of real users in production.

## Test profiles

| Test | Target | Duration at target | Purpose |
| --- | ---: | ---: | --- |
| Baseline | 500 VUs | Short, stable sample | Measure normal latency, throughput, errors, and resource use |
| Capacity | 2,000 VUs | 10–15 minutes | Validate the target under representative traffic |
| Headroom | 2,500–3,000 VUs | Record per run | Find the point where latency, errors, or resource use become unacceptable |
| Soak | 2,000 VUs | 30–60 minutes | Find leaks and performance degradation over time |

These are planned test targets, not results or current capacity claims.

## Workloads

The load suite covers four areas:

- Landing
- Authentication
- Owner
- Client portal

The existing GitHub Actions matrix runs these workload groups independently. This helps identify bottlenecks, but a 2,000-VU test of one group does not prove the whole application can handle 2,000 users at once.

To validate overall capacity, run a mixed workload against one shared application stack. Choose and document the traffic distribution based on expected usage. Include realistic think time and check business outcomes, not only HTTP status codes.

Keep account creation and other test setup outside the measured workload.

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

For a 2,000-VU target, this ramps to about 667, 1,333, and 2,000 VUs over six minutes, then holds the target for `TEST_DURATION`. The ramp time is additional to the hold time.

Use a 10–15 minute hold for the capacity test and 30–60 minutes for the soak test. Use a shorter stable hold for the baseline. Record the chosen duration for headroom tests.

`gracefulRampDown` gives VUs being removed time to finish an iteration. `gracefulStop` gives in-flight iterations time to finish when the test ends.

Use arrival-rate executors only when testing a target iteration arrival rate; that is a throughput test, not a concurrent-user test.

## What to measure

For each workload and important endpoint, record:

- Request and iteration throughput.
- Average, p95, and p99 response times.
- HTTP failure rate and business-check success rate.
- API CPU, memory, and worker restarts.
- PostgreSQL CPU, connections, slow queries, and locks.
- Redis, Nginx, queue, and storage errors or backlogs.

Watch the load generator too. If the GitHub runner or k6 process is saturated, the result may measure the generator rather than Sendocs.

## Pass criteria

Agree on endpoint latency objectives before using a run as evidence. Initial reliability targets are:

- HTTP request failure rate below 1%.
- At least 99% success for expected business operations.
- No sustained CPU or memory saturation, OOM events, or worker restarts.
- No database connection exhaustion or persistent query/lock bottleneck.
- No growing queue or connection backlog.
- No material latency or error-rate degradation during the steady period.

These are starting criteria, not measured SLOs. Exclude expected negative cases from business-success calculations and do not relax thresholds just to make a run pass.

## GitHub Actions

Use the [k6 load workflow](../.github/workflows/k6-load.yml) to run the production Compose stack in CI.

For each run, retain:

- Commit SHA and workflow run link.
- Runner CPU, memory, and operating environment.
- Image/build identifiers and k6 version.
- VU target, ramp stages, hold duration, and workload mix.
- k6 summary and resource metrics.
- Relevant application and container logs.

Repeat important profiles at least three times under the same conditions. Report all runs, not just the best one.

GitHub-hosted runner results are useful for repeatable CI comparisons. Before making a production-capacity claim, also test infrastructure representative of the intended deployment.

## Capacity claims

A capacity statement must include the workload, VU count, test duration, environment, throughput, latency, failure rate, and resource use.

For example, after successful testing:

> Sendocs was tested with 2,000 concurrent k6 VUs using a mixed workload for [duration] on [environment]. The test achieved [RPS], [p95 latency], and [failure rate].

Do not claim 2,000 concurrent users based only on an isolated workload, one short run, or a test where the load generator was saturated. Publish measured results in [performance.md](./performance.md).

## Open questions

- What traffic mix best represents expected Sendocs usage?
- What latency objectives should apply to each workload?
- What production-like environment should be used to validate the capacity claim?
- Should mixed-workload testing be added alongside the existing workload matrix?
