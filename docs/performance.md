# Performance and Scalability Validation

This document owns the progressive load-testing plan for Sendocs. It defines how each target is modelled, tested, evaluated, and recorded before moving to the next target.

The architecture and workload assumptions remain in [design.md](design.md). Significant infrastructure changes belong in [decisions.md](decisions.md), and should be made only when measurements justify them.

## Goals

Validate Sendocs against increasing daily active user (DAU) targets, one stage at a time:

| Stage | Target DAU | Status |
| --- | ---: | --- |
| 1 | 100 | Not started |
| 2 | 1,000 | Blocked |
| 3 | 10,000 | Blocked |
| 4 | 100,000 | Blocked |
| 5 | 1,000,000 | Blocked |
| 6 | 10,000,000 | Blocked |

A stage is not considered successful because a test completed. It passes only when its workload, acceptance criteria, and data-integrity checks pass and the results are recorded. Do not start the next stage until the current stage passes.

These are validation targets, not claims about current capacity or forecasts of user growth.

## Workload model

DAU alone does not define system load. Before each stage, define and record:

- Expected API requests per active user per day.
- Request creation and document upload frequency.
- Upload and download file-size distributions.
- Read/write mix and the main user journeys.
- Average request rate, peak request rate, and expected concurrency.
- Traffic burst shape and test duration.

Use the current estimates in [design.md](design.md) as the initial workload hypothesis, not as measured production usage. Check the assumptions against observed usage when real traffic becomes available. Do not assume that DAU scales directly to concurrency or peak requests per second.

For planning, calculate the request volume from the chosen requests-per-user assumption, then derive average request rate over 24 hours. Define peak rate and concurrency separately from expected usage patterns. Record all assumptions with each test result so that a DAU label is never used without its workload profile.

## User journeys to exercise

The workload should represent a realistic mix of owner and client activity:

1. Owner signs in and loads the dashboard.
2. Owner creates a document request with required items.
3. Owner lists and views requests and their progress.
4. Client opens a valid magic link and views required items.
5. Client uploads a document.
6. Owner views updated progress and downloads a document.
7. Owner deletes a document or request where included in the scenario.

Keep the mix realistic for the product. Do not make every virtual user execute every write operation on every iteration. Use test data that avoids accidental duplicate uploads to the same request item unless duplicate-upload handling is the behaviour being tested.

## Test types

Run the following tests as appropriate for each stage:

- **Smoke:** a small number of users to confirm the scenario and environment work.
- **Load:** the expected workload for the target stage, held long enough to observe steady behaviour.
- **Stress:** increase load beyond the target to identify the first bottleneck and failure mode.
- **Soak:** sustain representative load to reveal resource leaks, queue growth, or gradual degradation.
- **Recovery:** reduce or stop traffic after stress and verify the system recovers without manual data repair.

Start with smoke and load tests. Add stress, soak, and recovery tests before declaring a higher-risk stage complete.

## Measurements

Capture at least:

- Throughput: requests per second and completed business operations.
- Latency: p50, p95, and p99 by endpoint or user journey.
- Reliability: HTTP error rate, timeouts, and failed business operations.
- Application resources: CPU, memory, worker saturation, and restarts.
- Database: connection usage, slow queries, query latency, and lock contention.
- Background work: queue or outbox backlog, processing time, and retry/failure counts.
- File handling: upload/download throughput, duration, and storage errors.

A successful HTTP response alone is insufficient. Verify that created requests, uploaded files, progress, downloads, and deletions remain correct.

## Stage acceptance gate

A stage passes only when all of the following are true:

- The workload profile and test environment are documented.
- Smoke and target-load scenarios complete successfully.
- Latency and error-rate objectives set before the run are met.
- No unresolved data-integrity, authorization, or file-privacy failure occurs.
- Database, application workers, storage, and background processing remain within their defined operating limits.
- No sustained resource exhaustion or continuously growing backlog occurs.
- The system recovers after the test where recovery testing is required.
- Results are repeatable, or differences between runs are explained.
- The report records bottlenecks, follow-up work, and the stage decision.

Set numeric latency, error-rate, and resource thresholds before each stage based on product requirements and the measured baseline. Do not invent a passing threshold after seeing the results. A failed stage remains at that target until its bottlenecks are addressed and the test passes again.

## Running benchmarks without a paid load-testing server

Use an open-source load generator such as [k6](https://k6.io/) from a GitHub Actions runner when the available runner allowance is sufficient. No dedicated paid load-testing service or VPS is required for the initial experiments, but hosted-runner availability and usage limits depend on the GitHub account and repository plan.

There are two distinct test arrangements:

- **Application running on the runner:** start the application and its dependencies in the workflow, then run the load generator against it. This is useful for repeatable regression tests, but shared runner resources are not a reliable measure of production capacity.
- **Load generator running on the runner:** run the generator against an existing deployed demo or staging environment. This measures that environment, not an abstract application capacity. Keep the load controlled and only test environments you own or are authorized to test.

Record which arrangement was used. Never present a benchmark against a shared CI runner as proof that production can support the same DAU. At higher stages, check whether the runner can generate the required load without becoming the bottleneck. If it cannot, split the workload into controlled runs or arrange suitable load-generation capacity before making a capacity claim.

## Benchmark report

Record one report for every stage and significant retest:

| Field | Value |
| --- | --- |
| Stage / target DAU | |
| Date and commit | |
| Environment and deployment shape | |
| Test arrangement and load generator | |
| Workload profile and scenario mix | |
| Duration and ramp-up | |
| Peak RPS and concurrency | |
| p50 / p95 / p99 latency | |
| Error rate and failed operations | |
| Application / database / storage observations | |
| Queue or outbox backlog | |
| Bottlenecks and follow-up changes | |
| Result | Pass / Fail |
| Evidence (workflow run, dashboard, or report) | |

Keep actual results separate from estimates. Update the stage status table only when the acceptance gate is satisfied.

## Scaling approach

Begin with the architecture already documented in [design.md](design.md) and [decisions.md](decisions.md). At each stage:

1. Run the benchmark and identify the measured bottleneck.
2. Confirm the bottleneck with application, database, and infrastructure measurements.
3. Make the smallest justified change.
4. Re-run relevant correctness tests and the benchmark.
5. Record the result before advancing.

Do not add replicas, caches, queues, orchestration, or other infrastructure solely because a DAU milestone is larger. Evaluate each change against measured limits, operational cost, and the failure modes it introduces. Update the relevant design or decision document only when the architecture actually changes.
