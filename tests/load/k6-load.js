import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const TARGET_VUS = Number(__ENV.TARGET_VUS || 100);
const RAW_TEST_DURATION = __ENV.TEST_DURATION || '0';
const TEST_DURATION = RAW_TEST_DURATION === '0' ? '24h' : RAW_TEST_DURATION;
const REQUEST_INTERVAL_SECONDS = Math.max(60, TARGET_VUS * 0.3);

if (!Number.isSafeInteger(TARGET_VUS) || TARGET_VUS < 1) {
    throw new Error('TARGET_VUS must be a positive integer.');
}

const success = {
    home: new Rate('home_success'),
    user: new Rate('user_session_success'),
    ownerList: new Rate('owner_list_success'),
    ownerDetail: new Rate('owner_detail_success'),
    clientPortal: new Rate('client_portal_success'),
};

export const options = {
    scenarios: {
        sendocs_http_load: {
            executor: 'constant-vus',
            vus: TARGET_VUS,
            duration: TEST_DURATION,
            gracefulStop: '30s',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        home_success: ['rate>0.99'],
        user_session_success: ['rate>0.99'],
        owner_list_success: ['rate>0.99'],
        owner_detail_success: ['rate>0.99'],
        client_portal_success: ['rate>0.99'],
    },
};

export function setup() {
    const login = http.post(BASE_URL + '/api/v1/auth/login', JSON.stringify({
        email: 'alex@example.com',
        password: 'alex7890',
    }), { headers: { 'Content-Type': 'application/json' } });

    if (login.status !== 200) {
        throw new Error('Benchmark login failed with HTTP ' + login.status);
    }

    const cookie = login.cookies.sendocs_session && login.cookies.sendocs_session[0];
    const session = login.json();
    if (!cookie || !session.csrfToken) {
        throw new Error('Benchmark login did not return a session cookie and CSRF token.');
    }

    const headers = {
        Cookie: 'sendocs_session=' + cookie.value,
        'X-CSRF-Token': session.csrfToken,
        'Content-Type': 'application/json',
    };
    const created = http.post(BASE_URL + '/api/v1/requests', JSON.stringify({
        title: 'k6 benchmark ' + new Date().toISOString(),
        items: [{ label: 'Benchmark document' }],
    }), { headers: headers });

    if (created.status !== 201) {
        throw new Error('Benchmark request setup failed with HTTP ' + created.status);
    }

    const payload = created.json();
    const linkUrl = payload.link && payload.link.url;
    const portalToken = linkUrl ? linkUrl.split('/').filter(Boolean).pop() : null;
    if (!payload.request || !payload.request.id || !portalToken || !payload.request.items || !payload.request.items[0]) {
        throw new Error('Benchmark setup did not return a request ID, item ID, and portal token.');
    }

    // Exercise the client upload route once. The API intentionally limits
    // uploads per source IP, so this is a smoke request, not concurrent upload load.
    const itemId = payload.request.items[0].id;
    const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';
    const upload = http.post(
        BASE_URL + '/api/v1/portal/' + portalToken + '/items/' + itemId + '/file',
        { file: http.file(pdfContent, 'benchmark.pdf', 'application/pdf') },
    );

    if (upload.status !== 200) {
        throw new Error('Benchmark client upload setup failed with HTTP ' + upload.status);
    }

    return {
        cookie: headers.Cookie,
        csrfToken: session.csrfToken,
        requestId: payload.request.id,
        portalToken: portalToken,
    };
}

export default function (data) {
    if (__ITER === 0) {
        sleep(((__VU - 1) / TARGET_VUS) * REQUEST_INTERVAL_SECONDS);
    }

    const authenticated = { headers: { Cookie: data.cookie } };
    const endpoint = (__VU - 1) % 5;
    let response;
    let metric;
    let label;

    if (endpoint === 0) {
        response = http.get(BASE_URL + '/');
        metric = success.home;
        label = 'home page returns HTTP 200';
    } else if (endpoint === 1) {
        response = http.get(BASE_URL + '/api/v1/auth/session', authenticated);
        metric = success.user;
        label = 'authenticated user session returns HTTP 200';
    } else if (endpoint === 2) {
        response = http.get(BASE_URL + '/api/v1/requests', authenticated);
        metric = success.ownerList;
        label = 'owner request list returns HTTP 200';
    } else if (endpoint === 3) {
        response = http.get(BASE_URL + '/api/v1/requests/' + data.requestId, authenticated);
        metric = success.ownerDetail;
        label = 'owner request detail returns HTTP 200';
    } else {
        response = http.get(BASE_URL + '/api/v1/portal/' + data.portalToken);
        metric = success.clientPortal;
        label = 'client portal returns HTTP 200';
    }

    metric.add(check(response, { [label]: (res) => res.status === 200 }));
    sleep(REQUEST_INTERVAL_SECONDS);
}

export function teardown(data) {
    http.del(BASE_URL + '/api/v1/requests/' + data.requestId, null, {
        headers: {
            Cookie: data.cookie,
            'X-CSRF-Token': data.csrfToken,
        },
    });
}

function metricValue(data, name, key) {
    const values = data.metrics[name] && data.metrics[name].values;
    return values && values[key] !== undefined ? values[key] : null;
}

function format(value, suffix = '') {
    return value === null ? '—' : value.toFixed(2) + suffix;
}

export function handleSummary(data) {
    const requests = metricValue(data, 'http_reqs', 'count') || 0;
    const failedRate = metricValue(data, 'http_req_failed', 'rate');
    const maxVus = metricValue(data, 'vus_max', 'max');
    const rates = [
        ['home_success', 'Home success'],
        ['user_session_success', 'User/session success'],
        ['owner_list_success', 'Owner list success'],
        ['owner_detail_success', 'Owner detail success'],
        ['client_portal_success', 'Client portal success'],
    ];
    const passed = requests > 0 && failedRate !== null && failedRate < 0.01
        && rates.every(([name]) => metricValue(data, name, 'rate') > 0.99);
    const runId = __ENV.GITHUB_RUN_ID || 'local';
    const repository = __ENV.GITHUB_REPOSITORY || '';
    const server = __ENV.GITHUB_SERVER_URL || 'https://github.com';
    const commit = __ENV.GITHUB_SHA || '';
    const runUrl = repository ? server + '/' + repository + '/actions/runs/' + runId : '';
    const commitUrl = repository && commit ? server + '/' + repository + '/commit/' + commit : '';
    const duration = data.state && typeof data.state.testRunDurationMs === 'number'
        ? (data.state.testRunDurationMs / 1000).toFixed(1) + 's' : '—';
    const report = [
        '### Scalability Test - ' + new Date().toISOString().slice(0, 10),
        '',
        '- **Result:** ' + (passed ? 'Passed' : 'Failed'),
        '- **Load target:** ' + TARGET_VUS.toLocaleString() + ' concurrent HTTP VUs',
        '- **Duration policy:** ' + (RAW_TEST_DURATION === '0' ? 'Until manually cancelled or GitHub Actions job timeout' : RAW_TEST_DURATION),
        '- **Traffic:** Home, authenticated user/session, owner request list/detail, and client portal reads; one client upload is exercised during setup.',
        '- **Rate-limit handling:** VUs are staggered and paced; no IP spoofing or rate-limit bypass.',
        '- **Evidence:** ' + (runUrl ? '[Workflow run](' + runUrl + ')' : 'Local run')
            + (commitUrl ? ' · [Commit](' + commitUrl + ')' : ''),
        '',
        '| Metric | Result |',
        '| -------------------------------- | --------: |',
        '| Target virtual users | ' + TARGET_VUS.toLocaleString() + ' |',
        '| Peak virtual users | ' + (maxVus === null ? '—' : maxVus.toLocaleString()) + ' |',
        '| Total HTTP requests | ' + requests.toLocaleString() + ' |',
        '| Request rate | ' + format(metricValue(data, 'http_reqs', 'rate'), ' req/s') + ' |',
        '| Request latency (average) | ' + format(metricValue(data, 'http_req_duration', 'avg'), ' ms') + ' |',
        '| Request latency (p95) | ' + format(metricValue(data, 'http_req_duration', 'p(95)'), ' ms') + ' |',
        '| Request failure rate | ' + format(failedRate === null ? null : failedRate * 100, '%') + ' |',
        ...rates.map(([name, label]) => '| ' + label + ' | ' + format(metricValue(data, name, 'rate') * 100, '%') + ' |'),
        '| Actual test duration | ' + duration + ' |',
        '',
    ].join('\n');

    const output = {
        'scalability-results/benchmark-entry.md': report,
        stdout: report,
    };
    if (__ENV.GITHUB_STEP_SUMMARY) output[__ENV.GITHUB_STEP_SUMMARY] = report;
    return output;
}
