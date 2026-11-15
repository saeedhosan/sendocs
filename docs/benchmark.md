# Benchmark

Sendocs' load-test target is 1,000 concurrent users. GitHub Actions records measured benchmark results here; browser journey checks validate the end-to-end UI flow.

<!-- benchmark-run: 43757942516 -->
### Browser results — 2026-11-15T20:29:22.688Z

**Outcome:** Failed  
**Target:** 1,000 concurrent users  
**Browser validation:** 5 concurrent Chromium journeys  
**Commit:** [`d12699f`](https://github.com/saeedhosan/sendocs/commit/d12699f5e8b3d4767e4e76d73755bc7d4c576c6f) · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/43757942516)

| Metric | Result |
|---|---:|
| Browser journeys completed | 0/5 |
| Concurrent browser VUs reached | 5 |
| Functional checks | 1/5 (20.0%) |
| Browser request p95 | 306.25 ms |
| Browser request failure rate | 1.91% |
| Largest Contentful Paint p95 | 882.40 ms |
| GitHub runner | 4 vCPU / 15.6\n GB RAM |

Journey: landing → login/register/forgot password → owner dashboard → account/settings → create request → request detail → client portal → PDF upload.
