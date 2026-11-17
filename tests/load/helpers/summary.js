import {
    RAW_TEST_DURATION,
    TARGET_VUS,
    TEST_DURATION,
    WORKLOAD_GROUP,
} from '../config.js';

function metricValue(data, name, key) {
    const values = data.metrics[name] && data.metrics[name].values;
    return values && values[key] !== undefined ? values[key] : null;
}

function format(value, suffix) {
    return value === null ? '—' : value.toFixed(2) + (suffix || '');
}

function formatDuration(value) {
    const match = /^(\\d+)(s|m|h)$/.exec(value);
    if (!match) {
        return value;
    }
    const units = { s: 'second', m: 'minute', h: 'hour' };
    const amount = Number(match[1]);
    return amount + ' ' + units[match[2]] + (amount === 1 ? '' : 's');
}

function durationSeconds(value) {
    const match = /^(\\d+)(ms|s|m|h)$/.exec(value);
    if (!match) {
        return null;
    }
    const multipliers = { ms: 0.001, s: 1, m: 60, h: 3600 };
    return Number(match[1]) * multipliers[match[2]];
}

export function handleSummary(data) {
    const requests = metricValue(data, 'workload_http_requests', 'count') || 0;
    const totalRequests = metricValue(data, 'http_reqs', 'count') || 0;
    const setupRequests = Math.max(0, totalRequests - requests);
    const failedRate = metricValue(data, 'workload_http_failed', 'rate');
    const testSeconds = durationSeconds(TEST_DURATION);
    const throughput = testSeconds ? requests / testSeconds : null;
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
    const workloadNames = {
        landing: 'Landing',
        auth: 'Authentication',
        owner: 'Owner portal',
        client: 'Client portal',
    };
    const timestamp = new Date().toISOString();
    const report = [
        '### Scalability Test — ' + timestamp,
        '',
        '**Workload:** ' + workloadNames[WORKLOAD_GROUP],
        '',
        '- **Result:** ' + (passed ? 'Passed' : 'Failed'),
        '- **Target load:** ' + TARGET_VUS.toLocaleString() + ' concurrent HTTP VUs · ' + formatDuration(RAW_TEST_DURATION),
        '- **Environment:** GitHub Actions runner (Vite + Nginx + PHP-FPM + k6)',
        '- **Evidence:** ' + (runUrl ? '[Workflow run](' + runUrl + ')' : 'Local run') +
            (commitUrl ? ' · [Commit](' + commitUrl + ')' : ''),
        '',
        '| Metric | Result |',
        '|---|---:|',
        '| Peak virtual users | ' + (maxVus === null ? '—' : maxVus.toLocaleString()) + ' |',
        '| Workload HTTP requests | ' + requests.toLocaleString() + ' |',
        '| Setup HTTP requests (excluded) | ' + setupRequests.toLocaleString() + ' |',
        '| Workload throughput | ' + format(throughput, ' req/s') + ' |',
        '| Average workload response time | ' + format(metricValue(data, 'workload_http_req_duration', 'avg'), ' ms') + ' |',
        '| Workload p95 response time | ' + format(metricValue(data, 'workload_http_req_duration', 'p(95)'), ' ms') + ' |',
        '| Workload HTTP failure rate | ' + format(failedRate === null ? null : failedRate * 100, '%') + ' |',
        '',
    ].join('\\n');

    // Keep setup_data out of artifacts: it contains generated account passwords,
    // session cookies, CSRF tokens, and client portal tokens.
    const safeSummary = {
        root_group: data.root_group,
        options: data.options,
        state: data.state,
        metrics: data.metrics,
    };
    const output = {
        ['scalability-results/benchmark-entry-' + WORKLOAD_GROUP + '.md']: report,
        ['scalability-results/k6-summary-' + WORKLOAD_GROUP + '.json']: JSON.stringify(safeSummary, null, 2),
        stdout: report,
    };
    if (__ENV.GITHUB_STEP_SUMMARY) {
        output[__ENV.GITHUB_STEP_SUMMARY] = report;
    }
    return output;
}
