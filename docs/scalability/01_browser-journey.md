# Browser Journey Scalability Test

## Goal

Exercise Sendocs through real Chromium sessions against the complete Docker Compose application: frontend, API, PostgreSQL, queue worker, and private object storage.

The default benchmark is browser-first. The test uses k6's browser module and real UI interactions; it does not issue direct k6 HTTP requests.

## Workload

The initial run starts five concurrent Chromium virtual users. Each user completes one journey:

1. Open the landing page.
2. Visit login, registration, and forgot-password pages.
3. Authenticate through the UI: three users register and two users log in with isolated seeded accounts.
4. Visit the owner dashboard, account page, password settings, and account deletion page. The destructive delete form is never submitted.
5. Create a document request through the owner form.
6. Open the request detail page.
7. Follow the generated client portal link.
8. Select and upload a PDF through the browser file picker.

All five browser users visit the landing and public authentication pages. Three registrations and two logins stay below the documented per-IP authentication limits. Each journey creates its own request and uploads one file.

## Environment and limits

- Free GitHub-hosted runner; no external server or paid k6 service.
- Docker Compose runs the application and its dependencies.
- grafana/setup-k6-action installs k6 and Chromium.
- The application and browser load generator share the runner's CPU and memory.
- Five concurrent browsers are the initial workload. Increase concurrency only after measuring the runner and application under this workload.
- A single free GitHub runner is not a credible generator for 1,000 simultaneous Chromium sessions. If higher concurrency is needed, a protocol-level scenario can be added to the same tests/load/k6-load.js file while keeping browser journeys as the end-to-end check.
- Synthetic login accounts are temporary. Their credentials are removed before artifacts are uploaded.

## Measurements

The dated entry in [Benchmark](../benchmark.md) includes only metrics emitted by the browser run:

- Completed journeys and concurrent browser VUs
- Functional check pass rate
- Browser request count, p95 duration, and failure rate
- End-to-end journey p95
- Largest Contentful Paint p95, when emitted
- GitHub runner CPU and memory

The raw k6 summary and failure logs are retained as workflow artifacts for 14 days.

## Single source of truth

- Test script: tests/load/k6-load.js
- Workflow: .github/workflows/k6-loading.yml
- Result history: [Benchmark](../benchmark.md)

## References

- [k6 browser module](https://grafana.com/docs/k6/latest/using-k6-browser/)
- [k6 browser file upload API](https://grafana.com/docs/k6/latest/javascript-api/k6-browser/page/setinputfiles/)
- [k6 setup action](https://github.com/grafana/setup-k6-action)
