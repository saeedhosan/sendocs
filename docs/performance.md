## Performance Metrics

### Load test - 3k virtual users - 2026-11-28 06:30:41 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |        53,364.03 |    110.27 ms |    247.02 ms |    0.00% |  1 route |
| Authentication |         2,201.90 |  4,956.19 ms | 10,236.65 ms |    0.00% | 2 routes |
| Client portal  |         3,162.37 |  2,755.70 ms |  5,160.19 ms |    0.00% | 2 routes |
| Owner portal   |         4,208.85 |  2,326.90 ms |  4,254.93 ms |    0.00% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · Intel(R) Xeon(R) 6975P-C · 4 vCPU · 15.3 GiB RAM <br>
GitHub runner · 3000 concurrent virtual users · 60 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/46116796011)

### Load test - 3k virtual users - 2026-11-28 06:30:30 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |       228,175.57 |     68.32 ms |    151.66 ms |    0.00% |  1 route |
| Authentication |         3,044.77 |  6,440.56 ms | 13,238.82 ms |    0.00% | 2 routes |
| Client portal  |         5,684.37 |  2,664.21 ms |  5,338.67 ms |    0.00% | 2 routes |
| Owner portal   |         7,791.67 |  2,173.74 ms |  4,303.03 ms |    0.00% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · Intel(R) Xeon(R) 6975P-C · 4 vCPU · 15.3 GiB RAM <br>
GitHub runner · 3000 concurrent virtual users · 30 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/46116779877)
