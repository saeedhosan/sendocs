## Performance Metrics

### Load test - 3k virtual users - 2026-11-26 09:06:20 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |         9,776.34 |    162.93 ms |    275.55 ms |    0.00% |  1 route |
| Authentication |         1,735.26 |  1,313.38 ms |  5,237.18 ms |   73.76% | 2 routes |
| Client portal  |           987.47 |  2,245.80 ms |  4,000.25 ms |   32.62% | 2 routes |
| Owner portal   |         1,848.22 |  1,225.03 ms |  4,847.18 ms |   69.94% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · Intel(R) Xeon(R) 6975P-C · 4 vCPU · 15.3 GiB RAM <br>
GitHub runner · 3000 concurrent virtual users · 30 minutes · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45788615638)

### Load test - 3k virtual users - 2026-11-26 08:13:10 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |        17,712.95 |    152.19 ms |    214.63 ms |    0.00% |  1 route |

Environment: Ubuntu 26.04.1 LTS · Intel(R) Xeon(R) 6973P-C · 4 vCPU · 15.6 GiB RAM <br>
GitHub runner · 3000 concurrent virtual users · 30 minutes · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45781019074)
