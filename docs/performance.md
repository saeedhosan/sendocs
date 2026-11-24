## Performance Metrics

### Load test - 3k virtual users - 2026-11-24 07:44:50 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |        12,616.65 |    148.65 ms |    288.04 ms |    0.00% |  1 route |
| Authentication |         2,002.52 |  1,384.99 ms |  4,692.69 ms |   69.68% | 2 routes |
| Client portal  |         1,273.82 |  1,971.63 ms |  3,157.38 ms |   14.96% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · AMD EPYC 7763 64-Core Processor · 4 vCPU · 15.6 GiB RAM <br>
GitHub runner · 3000 concurrent virtual users · 10 minutes · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45350056316)

### Load test - 3k virtual users - 2026-11-24 07:43:20 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |       142,863.50 |     87.04 ms |    188.88 ms |    0.00% |  1 route |
| Authentication |         8,307.27 |  1,994.42 ms |  9,433.29 ms |   48.17% | 2 routes |
| Client portal  |         8,147.80 |  1,501.00 ms |  3,468.52 ms |   10.68% | 2 routes |
| Owner portal   |         9,877.73 |  1,568.75 ms |  4,366.12 ms |   29.79% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · Intel(R) Xeon(R) 6975P-C · 4 vCPU · 15.3 GiB RAM <br>
GitHub runner · 3000 concurrent virtual users · 30 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45349960068)
