# Scalability and Load Testing

This document defines how Sendocs measures application capacity, validates performance changes, and gathers evidence for scalability claims. It is the source of truth for the scalability test strategy; individual benchmark results belong in [performance.md](./performance.md).

## Goals

- Establish a repeatable baseline for representative application workloads.
- Validate a target of 2,000 concurrent active virtual users (VUs).
- Measure headroom beyond the target and identify saturation points.
- Detect degradation that only appears during sustained load.
- Keep capacity claims tied to a documented workload, environment, duration, and measured results.

A k6 VU represents a simulated user executing a workload. A result of 2,000 VUs does not mean 2,000 requests per second, 2,000 registered accounts, or a guarantee that every production deployment supports 2,000 real users.

## Scope and terminology

### Concurrency versus throughput

- **Virtual users (VUs):** concurrent k6 workers executing the configured workflow.
- **Iterations:** executions of a VU's default function. One iteration may issue multiple HTTP requests.
- **Requests per second (RPS):** HTTP requests completed per second.
- **Latency:** time taken by an HTTP request; report at least average and p95, and p99 where useful.
- **Failure rate:** proportion of requests or business checks that fail. Report both rather than treating them as interchangeable.

The current k6 scenarios use `ramping-vus`. This is appropriate for concurrency tests. Arrival-rate executors such as `ramping-arrival-rate` answer a different question: whether the system can sustain a specified iteration arrival rate independently of response time.

### Workload groups

The existing load suite has four workload groups:

- **Landing:** public landing/health-facing route coverage.
- **Authentication:** owner login and authenticated session resolution.
- **Owner:** authenticated owner dashboard and request operations.
- **Client:** magic-link portal and client upload operations.

Each workload should exercise the real HTTP path through the production-like web/API stack. Keep setup traffic (such as benchmark-account creation) separate from measured workload results.

The current GitHub Actions workflow runs these groups as separate matrix jobs, each on its own GitHub-hosted runner and application stack. A 2,000-VU run of one group is an isolated workload test; it is not evidence that one application instance handled 2,000 mixed users at once. The overall 2,000-user capacity claim requires a mixed-workload scenario in which the groups share the same application stack.

## Capacity test profiles

The following profiles define the planned validation sequence. They are targets, not claims that the tests have already passed.

| Test | Target | Load profile | Purpose |
| --- | ---: | --- | --- |
| Baseline | 500 VUs | Gradual ramp, then a short steady hold | Establish normal latency, throughput, failures, and resource use |
| Capacity target | 2,000 VUs | Gradual ramp, then 10–15 minutes at target | Validate the stated concurrency target under representative mixed traffic |
| Headroom | 2,500–3,000 VUs | Gradual ramp, then a steady hold | Find the saturation point and measure capacity above the target |
| Soak | 2,000 VUs | Gradual ramp, then 30–60 minutes at target | Detect memory growth, connection leaks, queue buildup, and latency degradation |

### Test 1 — Baseline (500 VUs)

Establish a reference point before evaluating the 2,000-VU target.

Record:
- Requests per second and completed iterations per second.
- Average, p95, and p99 latency by endpoint/workload.
- HTTP failure rate and business-check success rates.
- API, PostgreSQL, Redis, and Nginx CPU and memory use.
- Database connection use, slow queries, and relevant application errors.

Use the same workload mix, dataset shape, environment, and test settings when comparing later runs.

### Test 2 — Capacity target (2,000 VUs)

Gradually ramp to 2,000 concurrent VUs, then maintain that level for 10–15 minutes.

The mixed workload must represent expected product usage across landing, authentication, owner, and client operations. The initial distribution must be documented and treated as a test assumption until real usage data is available. Do not assume that equal distribution is representative.

Record the same metrics as the baseline, and check that performance remains stable throughout the steady period rather than relying only on a passing final summary.

### Test 3 — Headroom (2,500–3,000 VUs)

After the capacity target passes, increase the target to 2,500 VUs and then, if stable, 3,000 VUs.

The objective is to identify where latency, errors, or resource saturation become unacceptable. Stop increasing load if the system is unstable or the test environment itself becomes the bottleneck.

Report the highest level that met the agreed acceptance criteria. Do not describe the highest attempted VU count as supported capacity if it failed those criteria.

### Test 4 — Soak (2,000 VUs)

Ramp to 2,000 VUs and maintain the target for 30–60 minutes.

Look for:
- Increasing memory use or worker restarts.
- Database, Redis, or HTTP connection exhaustion.
- Growing queues or delayed background work.
- Increasing p95/p99 latency over time.
- Rising error rates or resource usage that does not recover.

A short test can miss these issues; the soak test is a separate validation profile.

## Load profile

Use k6's `ramping-vus` executor for concurrency profiles. The current scenario starts at zero VUs and uses three ramp stages followed by a steady stage:

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

For a 2,000-VU target, the ramp reaches approximately 667 VUs after two minutes, 1,333 after four minutes, and 2,000 after six minutes. The final stage holds 2,000 VUs for the configured `TEST_DURATION`.

- Baseline: use a short steady period sufficient to collect a stable reference.
- Capacity: set `TEST_DURATION` to 10–15 minutes.
- Headroom: use a steady period long enough to observe the target and resource behavior; record the chosen duration.
- Soak: set `TEST_DURATION` to 30–60 minutes.

The ramp duration is additional to the steady period. `gracefulRampDown` allows VUs being removed during a ramp-down to finish an iteration within the configured window. `gracefulStop` allows in-flight iterations to finish when the scenario ends. These settings do not extend the configured steady-state duration.

## Workload design

A capacity claim must use a mixed workload on one shared application stack. The exact distribution should reflect expected usage and be recorded with each benchmark. Until production usage data exists, document the distribution as an explicit assumption.

Workloads should:
- Use separate benchmark accounts and client identities where required.
- Exercise authenticated owner routes with valid sessions and CSRF behavior.
- Exercise client portal routes with valid magic links and realistic upload behavior.
- Include realistic think time so VUs behave like users rather than tight request loops.
- Avoid accidentally concentrating all VUs on one account, token, or rate-limit identity unless that is the behavior under test.
- Keep account/data preparation outside the measured interval.
- Validate response status and business outcomes, not just whether an HTTP request completed.

Keep isolated workload tests as diagnostic tests. They help identify which area is responsible when a mixed test degrades.

## Acceptance criteria

Define and review service-level objectives before treating a run as a pass. At minimum, evaluate:

| Area | Measurement | Initial evaluation |
| --- | --- | --- |
| Reliability | HTTP request failure rate | Target below 1% |
| Business correctness | Workload-specific success checks | Target at least 99%, with expected negative cases excluded |
| Latency | Average, p95, and p99 by endpoint | Must meet documented endpoint-level latency objectives |
| API resources | CPU, memory, worker restarts | No sustained saturation, OOM, or unexplained growth |
| Database | CPU, connections, query latency, locks | No connection exhaustion or persistent query/lock bottleneck |
| Supporting services | Redis, Nginx, queue and storage behavior | No resource exhaustion or growing backlog that affects the workload |
| Stability | Metrics across the steady period | No material degradation during the hold or soak period |

These are initial engineering gates, not measured Sendocs SLOs. Endpoint latency objectives and any workload-specific exceptions must be agreed and recorded before using a run to support a capacity claim. Do not weaken thresholds after a failed run merely to make CI green.

A test is inconclusive if the k6 generator or GitHub runner is saturated and cannot generate the intended load. Record generator CPU and resource usage so application limits can be distinguished from load-generator limits.

## GitHub Actions and repeatability

Use the [k6 load workflow](../.github/workflows/k6-load.yml) to build and exercise the production Compose images in CI.

For each run, preserve:
- Git commit SHA and workflow run URL.
- Image/build identifiers and application configuration relevant to performance.
- Runner specifications (CPU, memory, and operating environment).
- k6 version, executor, VU target, ramp stages, and steady duration.
- Workload group or mixed-workload distribution and dataset/setup details.
- k6 summary with RPS, iteration rate, latency percentiles, request failures, and business-check rates.
- Resource-monitor output and relevant application/container logs.

Run each important profile at least three times under the same conditions. Report individual results and the range; do not report only the best run. Keep setup and teardown outside the measured workload interval.

GitHub-hosted runners provide repeatable CI evidence, but they are shared test infrastructure and may vary. A production-capacity claim should also be validated on infrastructure representative of the intended production deployment, including its CPU/memory limits, database, object storage, and network topology.

## Evidence and capacity claims

A defensible claim must state:
1. The tested concurrency (VUs), not an ambiguous number of users.
2. The workload mix and routes/operations exercised.
3. Ramp duration and steady-state duration.
4. The environment and resource specifications.
5. Repeated results for throughput, latency, failure rate, and resource use.
6. Known limitations, including whether the test ran on CI or production-like infrastructure.

Use precise wording. For example, after successful validation:

> Sendocs was validated with 2,000 concurrent k6 virtual users using a documented mixed workload for [duration] on [environment]. The test achieved [RPS], [p95 latency], and [failure rate], with [resource observations].

Do not claim that Sendocs supports 2,000 concurrent real-world users based only on an isolated workload test, a single short run, or a CI run whose load generator was saturated. Publish measured results in [performance.md](./performance.md).

## Open questions

- What mixed-workload distribution best represents expected Sendocs usage?
- What endpoint-level latency objectives should be used for owner, authentication, and client portal operations?
- What production-like infrastructure should be the reference environment for the capacity claim?
- Should mixed-workload testing be added as a separate scenario alongside the existing isolated workload matrix?
