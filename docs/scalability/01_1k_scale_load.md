# 1K Concurrent User Load Test

## Target

Test Sendocs with 1,000 concurrent users.

## Workload

Users exercise the main Sendocs journey:

1. Register or sign in.
2. Open the owner dashboard and account settings.
3. Create a document request.
4. Open the client portal.
5. Upload a PDF.

The k6 browser journey validates the real UI and end-to-end flow. The 1,000-user target is the load objective; the current five-browser run is a functional browser check, not evidence that the target has been reached.

## Environment

- GitHub-hosted free runner and Docker Compose.
- One k6 script: `tests/load/k6-load.js`.
- One workflow: `.github/workflows/k6-loading.yml`.
- Results: [Benchmark](../benchmark.md).

## Results

The workflow records completed browser journeys, request performance, journey duration, LCP (when available), and runner resources. Only measured results are reported.

## References

- [k6 browser](https://grafana.com/docs/k6/latest/using-k6-browser/)
- [Browser file uploads](https://grafana.com/docs/k6/latest/javascript-api/k6-browser/page/setinputfiles/)
- [k6 setup action](https://github.com/grafana/setup-k6-action)
