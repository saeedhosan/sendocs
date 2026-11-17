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

function format(value) {
    return value === null ? '—' : value.toFixed(2);
}

function formatDuration(value) {
    const match = /^(\d+)(ms|s|m|h)$/.exec(value);
    if (!match) {
        return value;
    }

    const multipliers = { ms: 0.001, s: 1, m: 60, h: 3600 };
    const seconds = Number(match[1]) * multipliers[match[2]];

    if (seconds < 60) {
        return seconds + ' second' + (seconds === 1 ? '' : 's');
    }
    if (seconds < 3600) {
        const minutes = seconds / 60;
        return minutes + ' minute' + (minutes === 1 ? '' : 's');
    }

    const hours = seconds / 3600;
    return hours + ' hour' + (hours === 1 ? '' : 's');
}

function durationSeconds(value) {
    const match = /^(\d+)(ms|s|m|h)$/.exec(value);
    if (!match) {
        return null;
    }
    const multipliers = { ms: 0.001, s: 1, m: 60, h: 3600 };
    return Number(match[1]) * multipliers[match[2]];
}

export function handleSummary(data) {
    const requests = metricValue(data, 'workload_http_requests', 'count') || 0;
    const failedRate = metricValue(data, 'workload_http_failed', 'rate');
    const testSeconds = durationSeconds(TEST_DURATION);
    const throughput = testSeconds ? requests / testSeconds : null;
    const average = metricValue(data, 'workload_http_req_duration', 'avg');
    const p95 = metricValue(data, 'workload_http_req_duration', 'p(95)');
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
    const timestamp = __ENV.RUN_STARTED_AT || new Date().toISOString();
    const report = [
        '### Results — ' + TARGET_VUS.toLocaleString() + ' VUs - ' + timestamp,
        '',
        '- **Target load:** ' + TARGET_VUS.toLocaleString() + ' Virtual Users · ' + formatDuration(RAW_TEST_DURATION),
        '- **Environment:** GitHub Actions · `ubuntu-latest`',
        '- **Evidence:** ' + (runUrl ? '[Workflow run](' + runUrl + ')' : 'Local run') +
            (commitUrl ? ' · [Commit](' + commitUrl + ')' : ''),
        '',
        '| Workload | Throughput (req/s) | Avg (ms) | p95 (ms) | Failures (%) |',
        '|---|---:|---:|---:|---:|',
        '| ' + workloadNames[WORKLOAD_GROUP] + ' | ' + format(throughput) + ' | ' +
            format(average) + ' | ' + format(p95) + ' | ' +
            format(failedRate === null ? null : failedRate * 100) + ' |',
        '',
    ].join('\n');

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
