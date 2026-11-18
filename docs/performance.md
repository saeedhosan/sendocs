## Performance Metrics

### Load test - 1k virtual users - 2026-11-18 06:51:21 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |        11,818.03 |     48.33 ms |    100.22 ms |    0.00% |  1 route |
| Authentication |            32.90 | 30,952.08 ms | 55,573.60 ms |    0.00% | 2 routes |
| Client portal  |           143.60 |  6,026.85 ms |  9,316.21 ms |    0.00% | 2 routes |
| Owner portal   |            95.95 |  9,524.07 ms | 10,809.28 ms |    0.00% | 2 routes |

_GitHub-hosted runner · 1000 concurrent virtual users · 60 seconds_ <br>
_Environment: Ubuntu 26.04.1 LTS · AMD EPYC 9V74 · 4 vCPU · 15.6 GiB RAM_

### Load test - 500 virtual users - 2026-11-18 04:42:31 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |         7,589.72 |     65.63 ms |     86.11 ms |    0.00% |  1 route |
| Authentication |            21.07 | 23,726.29 ms | 59,952.83 ms |   30.30% | 2 routes |
| Client portal  |            63.90 |  6,560.85 ms | 59,644.93 ms |    7.72% | 2 routes |
| Owner portal   |            37.60 | 12,192.85 ms | 59,742.28 ms |   18.31% | 2 routes |

_GitHub-hosted runner · 500 concurrent virtual users · 60 seconds_<br>
_Environment: Ubuntu 26.04.1 LTS · AMD EPYC 7763 · 4 vCPU · 15.6 GiB RAM_
