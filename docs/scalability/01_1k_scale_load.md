# 1K Scale Load Test

## Goal

Measure Sendocs under increasing load, working toward 1,000 concurrent users. The 1K figure is a target, not an achieved result.

## Workload

The default test uses k6 with five concurrent Chromium users. Each user:

1. Visits the landing and authentication pages.
2. Registers through the UI.
3. Opens the owner dashboard and account settings.
4. Creates a document request.
5. Opens its client portal and uploads a PDF.

The test exercises the full Docker Compose application. It uses real browser interactions, not direct k6 HTTP requests.

## Environment and limits

- Runs on a free GitHub-hosted runner with Docker Compose.
- The application and Chromium browsers share runner CPU and memory.
- Five browsers establish the initial baseline; increase load only after reviewing results.
- One free runner cannot credibly generate 1,000 simultaneous browser sessions. If needed, add protocol-level load to the same k6 script.

## Results

Recorded metrics are limited to those emitted by the run: completed journeys, concurrent VUs, functional checks, browser request performance, journey duration, LCP (when available), and runner resources.

Results are stored in [Benchmark](../benchmark.md). Workflow artifacts retain the k6 summary and failure logs for 14 days.

## Test files

- Script: `tests/load/k6-load.js`
- Workflow: `.github/workflows/k6-loading.yml`
- Results: [`docs/benchmark.md`](../benchmark.md)

## References

- [k6 browser](https://grafana.com/docs/k6/latest/using-k6-browser/)
- [Browser file uploads](https://grafana.com/docs/k6/latest/javascript-api/k6-browser/page/setinputfiles/)
- [k6 setup action](https://github.com/grafana/setup-k6-action)
