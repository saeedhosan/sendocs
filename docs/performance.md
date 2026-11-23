## Performance Metrics

### Load test - 2k virtual users - 2026-11-23 19:13:40 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |        12,831.88 |     99.67 ms |    192.57 ms |    0.00% |  1 route |
| Authentication |         1,139.27 |  1,736.12 ms |  2,567.80 ms |    0.00% | 2 routes |
| Client portal  |         1,336.78 |    849.44 ms |  1,123.53 ms |    0.00% | 2 routes |
| Owner portal   |           538.90 |  4,288.82 ms |  5,934.73 ms |    0.00% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · AMD EPYC 7763 64-Core Processor · 4 vCPU · 15.6 GiB RAM <br>
GitHub runner · 2000 concurrent virtual users · 10 minutes · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45246274455)

### Load test - 2k virtual users - 2026-11-23 19:13:30 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |       113,597.63 |     49.16 ms |    103.04 ms |    0.00% |  1 route |
| Authentication |         4,184.10 |  1,373.10 ms |  2,870.77 ms |    0.00% | 2 routes |
| Client portal  |         2,926.47 |  1,664.60 ms |  3,214.20 ms |    0.00% | 2 routes |
| Owner portal   |         4,135.30 |  1,395.44 ms |  2,572.78 ms |    0.00% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · AMD EPYC 7763 64-Core Processor · 4 vCPU · 15.6 GiB RAM <br>
GitHub runner · 2000 concurrent virtual users · 60 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45246248597)

### Load test - 2k virtual users - 2026-11-23 19:12:47 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |       208,796.33 |     46.06 ms |    105.24 ms |    0.00% |  1 route |
| Authentication |         7,029.00 |  1,456.78 ms |  2,862.49 ms |    0.00% | 2 routes |
| Client portal  |         5,566.13 |  1,452.26 ms |  2,961.52 ms |    0.00% | 2 routes |
| Owner portal   |         7,649.70 |  1,291.30 ms |  2,537.87 ms |    0.00% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · Intel(R) Xeon(R) 6975P-C · 4 vCPU · 15.3 GiB RAM <br>
GitHub runner · 2000 concurrent virtual users · 30 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45246200872)
