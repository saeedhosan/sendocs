## Performance Metrics

### Load test - 500 virtual users - 2026-11-23 17:18:43 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |       137,445.45 |      9.58 ms |     25.15 ms |    0.00% |  1 route |
| Authentication |         3,433.83 |     32.98 ms |    104.22 ms |    0.00% | 2 routes |
| Client portal  |         1,818.05 |      5.43 ms |      9.19 ms |    0.00% | 2 routes |
| Owner portal   |         3,108.83 |     92.67 ms |    245.22 ms |    0.00% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · Intel(R) Xeon(R) 6975P-C · 4 vCPU · 15.3 GiB RAM <br>
GitHub runner · 500 concurrent virtual users · 60 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45225953131)

### Load test - 500 virtual users - 2026-11-23 17:18:17 UTC

| Workload       | Throughput (RPS) | Avg. latency |  p95 latency | Failures | Coverage |
| -------------- | ---------------: | -----------: | -----------: | -------: | -------: |
| Landing        |       281,288.70 |      7.50 ms |     19.64 ms |    0.00% |  1 route |
| Authentication |         6,123.80 |     22.20 ms |     80.33 ms |    0.00% | 2 routes |
| Client portal  |         3,177.83 |      7.24 ms |     13.87 ms |    0.00% | 2 routes |
| Owner portal   |         5,554.73 |     79.53 ms |    240.59 ms |    0.00% | 2 routes |

Environment: Ubuntu 26.04.1 LTS · Intel(R) Xeon(R) 6975P-C · 4 vCPU · 15.3 GiB RAM <br>
GitHub runner · 500 concurrent virtual users · 30 seconds · [Workflow run](https://github.com/saeedhosan/sendocs/actions/runs/45225879606)
