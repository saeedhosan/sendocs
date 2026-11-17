import { Counter, Rate, Trend } from 'k6/metrics';

export const workloadRequests = new Counter('workload_http_requests');
export const workloadDuration = new Trend('workload_http_req_duration', true);
export const workloadFailed = new Rate('workload_http_failed');

export function recordWorkloadRequest(response) {
    workloadRequests.add(1);
    workloadDuration.add(response.timings.duration);
    workloadFailed.add(response.status === 0 || response.status >= 400);
}
