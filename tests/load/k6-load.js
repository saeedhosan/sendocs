import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const TARGET_VUS = Number(__ENV.TARGET_VUS || 1000);
const TEST_DURATION = __ENV.TEST_DURATION || '60s';

if (!Number.isSafeInteger(TARGET_VUS) || TARGET_VUS < 1) {
    throw new Error('TARGET_VUS must be a positive integer.');
}

const healthCheckSuccess = new Rate('health_check_success');

export const options = {
    scenarios: {
        health_load: {
            executor: 'constant-vus',
            vus: TARGET_VUS,
            duration: TEST_DURATION,
            gracefulStop: '30s',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        health_check_success: ['rate>0.99'],
    },
};

export default function () {
    const response = http.get(`${BASE_URL}/health`);
    const healthy = check(response, {
        'health endpoint returns HTTP 200': (res) => res.status === 200,
    });

    healthCheckSuccess.add(healthy);
    sleep(1);
}

function metric(data, name, key) {
    const values = data.metrics[name] && data.metrics[name].values;
    return values && values[key] !== undefined ? values[key] : null;
}

function format(value, suffix = '') {
    return value === null ? '—' : value.toFixed(2) + suffix;
}

export function handleSummary(data) {
    const requests = metric(data, 'http_reqs', 'count') || 0;
    const requestRate = metric(data, 'http_reqs', 'rate');
    const failedRate = metric(data, 'http_req_failed', 'rate');
    const p95 = metric(data, 'http_req_duration', 'p(95)');
    const average = metric(data, 'http_req_duration', 'avg');
    const checkRate = metric(data, 'health_check_success', 'rate');
    const maxVus = metric(data, 'vus_max', 'max');
    const duration = data.state && typeof data.state.testRunDurationMs === 'number'
        ? (data.state.testRunDurationMs / 1000).toFixed(1) + 's'
        : '—';
    const passed = requests > 0
        && failedRate !== null && failedRate < 0.01
        && checkRate !== null && checkRate > 0.99;

    const runId = __ENV.GITHUB_RUN_ID || 'local';
    const repository = __ENV.GITHUB_REPOSITORY || '';
    const server = __ENV.GITHUB_SERVER_URL || 'https://github.com';
    const commit = __ENV.GITHUB_SHA || '';
    const runUrl = repository ? `${server}/${repository}/actions/runs/${runId}` : '';
    const commitUrl = repository && commit ? `${server}/${repository}/commit/${commit}` : '';
    const date = new Date().toISOString().slice(0, 10);
    const report = [
        `### Scalability Test - ${date}`,
        '',
        `- **Result:** ${passed ? 'Passed' : 'Failed'}`,
        `- **Load target:** ${TARGET_VUS.toLocaleString()} concurrent HTTP VUs`,
        '- **Test scenario:** Repeated HTTP requests to the Sendocs health endpoint.',
        '- **Evidence:** ' + (runUrl ? `[Workflow run](${runUrl})` : 'Local run')
            + (commitUrl ? ` · [Commit](${commitUrl})` : ''),
        '',
        '| Metric | Result |',
        '| -------------------------------- | --------: |',
        `| Target virtual users | ${TARGET_VUS.toLocaleString()} |`,
        `| Peak virtual users | ${maxVus === null ? '—' : maxVus.toLocaleString()} |`,
        `| Total HTTP requests | ${requests.toLocaleString()} |`,
        `| Request rate | ${format(requestRate, ' req/s')} |`,
        `| Request latency (average) | ${format(average, ' ms')} |`,
        `| Request latency (p95) | ${format(p95, ' ms')} |`,
        `| Request failure rate | ${format(failedRate === null ? null : failedRate * 100, '%')} |`,
        `| Successful health checks | ${format(checkRate === null ? null : checkRate * 100, '%')} |`,
        `| Test duration | ${duration} |`,
        '',
    ].join('\\n');

    const output = {
        'scalability-results/benchmark-entry.md': report,
        stdout: report,
    };
    if (__ENV.GITHUB_STEP_SUMMARY) {
        output[__ENV.GITHUB_STEP_SUMMARY] = report;
    }
    return output;
}
