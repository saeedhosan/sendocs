import * as landing from './workloads/landing.js';
import * as auth from './workloads/auth.js';
import * as owner from './workloads/owner.js';
import * as client from './workloads/client.js';
import {
    RAW_TEST_DURATION,
    TARGET_VUS,
    TEST_DURATION,
    WORKLOAD_GROUP,
} from './config.js';

const WORKLOADS = { landing, auth, owner, client };
const workload = WORKLOADS[WORKLOAD_GROUP];

function groupThresholds() {
    const thresholds = { http_req_failed: ['rate<0.01'] };
    const names = {
        landing: ['landing_success'],
        auth: ['auth_login_success', 'auth_session_success'],
        owner: ['owner_list_success', 'owner_detail_success'],
        client: ['client_upload_success', 'client_portal_success'],
    };
    names[WORKLOAD_GROUP].forEach((name) => {
        thresholds[name] = ['rate>0.99'];
    });
    return thresholds;
}

export const options = {
    scenarios: {
        workload: {
            executor: 'constant-vus',
            vus: TARGET_VUS,
            duration: TEST_DURATION,
            gracefulStop: '5s',
        },
    },
    thresholds: groupThresholds(),
};

export function setup() {
    return workload.setup();
}

export default function (data) {
    workload.default(data);
}

function metricValue(data, name, key) {
    const values = data.metrics[name] && data.metrics[name].values;
    return values && values[key] !== undefined ? values[key] : null;
}

function format(value, suffix) {
    return value === null ? '—' : value.toFixed(2) + (suffix || '');
}

export function handleSummary(data) {
    const requests = metricValue(data, 'http_reqs', 'count') || 0;
    const failedRate = metricValue(data, 'http_req_failed', 'rate');
    const maxVus = metricValue(data, 'vus_max', 'max');
    const metricLabels = {
        landing: [['landing_success', 'Landing success']],
        auth: [['auth_login_success', 'Login success'], ['auth_session_success', 'Session success']],
        owner: [['owner_list_success', 'Owner request-list success'], ['owner_detail_success', 'Owner request-detail success']],
        client: [['client_upload_success', 'Client upload success'], ['client_portal_success', 'Client portal success']],
    };
    const rates = metricLabels[WORKLOAD_GROUP];
    const passed = requests > 0 && failedRate !== null && failedRate < 0.01 &&
        rates.every(([name]) => {
            const value = metricValue(data, name, 'rate');
            return value !== null && value > 0.99;
        });
    const runId = __ENV.GITHUB_RUN_ID || 'local';
    const repository = __ENV.GITHUB_REPOSITORY || '';
    const server = __ENV.GITHUB_SERVER_URL || 'https://github.com';
    const commit = __ENV.GITHUB_SHA || '';
    const runUrl = repository ? server + '/' + repository + '/actions/runs/' + runId : '';
    const commitUrl = repository && commit ? server + '/' + repository + '/commit/' + commit : '';
    const duration = data.state && typeof data.state.testRunDurationMs === 'number'
        ? (data.state.testRunDurationMs / 1000).toFixed(1) + 's' : '—';
    const report = [
        '### Scalability Test - ' + new Date().toISOString().slice(0, 10) + ' (' + WORKLOAD_GROUP + ')',
        '',
        '- **Result:** ' + (passed ? 'Passed' : 'Failed'),
        '- **Workload group:** ' + WORKLOAD_GROUP,
        '- **Load target:** ' + TARGET_VUS.toLocaleString() + ' concurrent HTTP VUs',
        '- **Duration policy:** ' + RAW_TEST_DURATION,
        '- **Evidence:** ' + (runUrl ? '[Workflow run](' + runUrl + ')' : 'Local run') +
            (commitUrl ? ' · [Commit](' + commitUrl + ')' : ''),
        '',
        '| Metric | Result |',
        '| -------------------------------- | --------: |',
        '| Target virtual users | ' + TARGET_VUS.toLocaleString() + ' |',
        '| Peak virtual users | ' + (maxVus === null ? '—' : maxVus.toLocaleString()) + ' |',
        '| Total HTTP requests (including setup) | ' + requests.toLocaleString() + ' |',
        '| Request rate | ' + format(metricValue(data, 'http_reqs', 'rate'), ' req/s') + ' |',
        '| Request latency (average) | ' + format(metricValue(data, 'http_req_duration', 'avg'), ' ms') + ' |',
        '| Request latency (p95) | ' + format(metricValue(data, 'http_req_duration', 'p(95)'), ' ms') + ' |',
        '| Request failure rate | ' + format(failedRate === null ? null : failedRate * 100, '%') + ' |',
        ...rates.map(([name, label]) => '| ' + label + ' | ' + format(metricValue(data, name, 'rate') === null ? null : metricValue(data, name, 'rate') * 100, '%') + ' |'),
        '| Actual test duration | ' + duration + ' |',
        '',
    ].join('\n');

    const output = {
        ['scalability-results/benchmark-entry-' + WORKLOAD_GROUP + '.md']: report,
        ['scalability-results/k6-summary-' + WORKLOAD_GROUP + '.json']: JSON.stringify(data, null, 2),
        stdout: report,
    };
    if (__ENV.GITHUB_STEP_SUMMARY) {
        output[__ENV.GITHUB_STEP_SUMMARY] = report;
    }
    return output;
}
