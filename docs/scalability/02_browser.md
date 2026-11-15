# Browser Journey Benchmark

## Goal

Measure Sendocs through real Chromium sessions using the actual frontend, API, PostgreSQL database, and private object storage in Docker Compose. This test is separate from the k6 HTTP benchmark.

## Browser workload

Each run starts five concurrent Chromium virtual users. Each user completes one browser journey:

1. Open the public landing page.
2. Authenticate through the UI: three users register; two users sign in with isolated seeded accounts. The sign-in users also open the forgot-password page.
3. Load the owner dashboard.
4. Create a document request through the owner form.
5. Open the request detail page.
6. Follow the generated client portal link.
7. Select and upload a valid PDF through the browser file input.

The test uses the application's real rate limits. Three registrations and two logins stay below the documented per-IP limits. The portal receives five reads and five uploads in a run.

## Environment and limits

- Runs on a free GitHub-hosted runner with Docker Compose and local k6.
- k6's browser module launches Chromium; no Grafana Cloud service is used.
- The application and browser load generator share the same runner resources.
- Five concurrent browsers are an initial measured workload, not a claim of 1,000 concurrent browser capacity.
- A single GitHub-hosted runner is not a credible generator for 1,000 simultaneous Chromium sessions. Larger browser concurrency requires distributed browser workers; the separate HTTP benchmark is not part of this browser test.
- Synthetic accounts and their session credentials are temporary. Credentials are removed before artifacts are uploaded.

## Measurements

The workflow records only metrics emitted by the executed browser run:

- Completed end-to-end journeys and check pass rate
- Browser HTTP request failure rate and p95 duration
- Journey p95 duration
- Largest Contentful Paint p95 when emitted by k6
- GitHub runner CPU and memory

The dated result is appended to [Benchmark](../benchmark.md). The raw k6 summary and failure logs are retained as workflow artifacts for 14 days.

## Covered pages

Landing, login, registration, forgot password, owner dashboard, new request, request detail, and client portal.

## References

- [k6 browser module](https://grafana.com/docs/k6/latest/using-k6-browser/)
- [k6 browser test setup action](https://github.com/grafana/setup-k6-action)
