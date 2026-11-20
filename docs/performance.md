## Performance Metrics

### Load test - 1,500 virtual users - 2026-11-20 12:50:39 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |        15,404.40 |     67.74 ms |    154.68 ms |    0.00% |  1 route |
| Authentication |            16.22 | 33,958.31 ms | 59,757.23 ms |   13.77% | 2 routes |
| Client portal  |            79.45 | 13,228.58 ms | 19,077.83 ms |    0.82% | 2 routes |
| Owner portal   |           106.75 | 11,201.55 ms | 15,904.16 ms |    1.72% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · AMD EPYC 9V74 80-Core Processor · 4 vCPU · 15.6 GiB RAM <br>
GitHub runner · 1500 concurrent virtual users · 60 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/44738682433)

### Load test - 1k virtual users - 2026-11-18 06:51:21 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |        11,818.03 |     48.33 ms |    100.22 ms |    0.00% |  1 route |
| Authentication |            32.90 | 30,952.08 ms | 55,573.60 ms |    0.00% | 2 routes |
| Client portal  |           143.60 |  6,026.85 ms |  9,316.21 ms |    0.00% | 2 routes |
| Owner portal   |            95.95 |  9,524.07 ms | 10,809.28 ms |    0.00% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · AMD EPYC 9V74 · 4 vCPU · 15.6 GiB RAM <br>
GitHub runner · 1000 concurrent virtual users · 60 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/44253988941)

### Load test - 500 virtual users - 2026-11-18 04:42:31 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |         7,589.72 |     65.63 ms |     86.11 ms |    0.00% |  1 route |
| Authentication |            21.07 | 23,726.29 ms | 59,952.83 ms |   30.30% | 2 routes |
| Client portal  |            63.90 |  6,560.85 ms | 59,644.93 ms |    7.72% | 2 routes |
| Owner portal   |            37.60 | 12,192.85 ms | 59,742.28 ms |   18.31% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · AMD EPYC 7763 · 4 vCPU · 15.6 GiB RAM<br>
GitHub runner · 500 concurrent virtual users · 60 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/44245054363)
