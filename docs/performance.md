## Performance Metrics

### Load test - 1k virtual users - 2026-11-23 18:19:20 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |       230,372.17 |     17.90 ms |     45.30 ms |    0.00% |  1 route |
| Authentication |         6,690.97 |    500.73 ms |  1,066.80 ms |    0.00% | 2 routes |
| Client portal  |         6,224.37 |     32.19 ms |    139.31 ms |    0.00% | 2 routes |
| Owner portal   |         4,773.87 |    922.40 ms |  1,874.44 ms |    0.00% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · AMD EPYC 7763 64-Core Processor · 4 vCPU · 15.6 GiB RAM <br>
GitHub runner · 1000 concurrent virtual users · 30 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45236711870)

### Load test - 1k virtual users - 2026-11-23 18:19:33 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |       136,048.77 |     17.56 ms |     42.36 ms |    0.00% |  1 route |
| Authentication |         4,278.23 |    387.87 ms |    802.75 ms |    0.00% | 2 routes |
| Client portal  |         3,582.00 |     22.82 ms |     94.09 ms |    0.00% | 2 routes |
| Owner portal   |         4,171.92 |    410.10 ms |    892.79 ms |    0.00% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · AMD EPYC 9V45 96-Core Processor · 4 vCPU · 15.6 GiB RAM <br>
GitHub runner · 1000 concurrent virtual users · 60 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45236786676)
