import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const TARGET_VUS = Number(__ENV.TARGET_VUS || 100);
const WORKLOAD_GROUP = __ENV.WORKLOAD_GROUP || 'landing';
const RAW_TEST_DURATION = __ENV.TEST_DURATION || '60s';
const TEST_DURATION = RAW_TEST_DURATION === '0' ? '24h' : RAW_TEST_DURATION;
const PASSWORD = 'Benchmark-pass-123!';

const GROUPS = ['landing', 'auth', 'owner', 'client'];
if (GROUPS.indexOf(WORKLOAD_GROUP) === -1) {
    throw new Error('WORKLOAD_GROUP must be one of: ' + GROUPS.join(', '));
}
if (!Number.isSafeInteger(TARGET_VUS) || TARGET_VUS < 1) {
    throw new Error('TARGET_VUS must be a positive integer.');
}

const success = {
    landing: new Rate('landing_success'),
    authLogin: new Rate('auth_login_success'),
    authSession: new Rate('auth_session_success'),
    ownerList: new Rate('owner_list_success'),
    ownerDetail: new Rate('owner_detail_success'),
    clientUpload: new Rate('client_upload_success'),
    clientPortal: new Rate('client_portal_success'),
};

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

// 198.18.0.0/15 is reserved for benchmarking. Each test account/VU gets one address.
function clientIp(index) {
    const offset = index;
    return '198.' + (18 + Math.floor(offset / 65536)) + '.' +
        Math.floor((offset % 65536) / 256) + '.' + (offset % 256);
}

function registerAccount(index) {
    const runId = __ENV.GITHUB_RUN_ID || 'local';
    const email = 'k6-' + runId + '-' + WORKLOAD_GROUP + '-' + Date.now() + '-' + index + '@example.test';
    const ip = clientIp(index);
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-IP': ip,
    };
    const registered = http.post(BASE_URL + '/api/v1/auth/register', JSON.stringify({
        name: 'k6 benchmark ' + WORKLOAD_GROUP + ' ' + index,
        email: email,
        password: PASSWORD,
    }), { headers: headers, tags: { phase: 'setup' } });

    if (registered.status !== 201) {
        throw new Error('Benchmark account registration failed for VU ' + index + ' with HTTP ' + registered.status);
    }

    const session = registered.json();
    const cookie = registered.cookies.sendocs_session && registered.cookies.sendocs_session[0];
    if (!cookie || !session.csrfToken) {
        throw new Error('Benchmark registration did not return a session cookie and CSRF token for VU ' + index);
    }

    return {
        email: email,
        password: PASSWORD,
        cookie: 'sendocs_session=' + cookie.value,
        csrfToken: session.csrfToken,
        clientIp: ip,
    };
}

function createRequest(account, index) {
    const created = http.post(BASE_URL + '/api/v1/requests', JSON.stringify({
        title: 'k6 ' + WORKLOAD_GROUP + ' benchmark ' + index,
        items: [{ label: 'Benchmark document ' + index }],
    }), {
        headers: {
            Cookie: account.cookie,
            'X-CSRF-Token': account.csrfToken,
            'X-Client-IP': account.clientIp,
            'Content-Type': 'application/json',
        },
        tags: { phase: 'setup' },
    });

    if (created.status !== 201) {
        throw new Error('Benchmark request setup failed for VU ' + index + ' with HTTP ' + created.status);
    }

    const payload = created.json();
    const linkUrl = payload.link && payload.link.url;
    const portalToken = linkUrl ? linkUrl.split('/').filter(Boolean).pop() : null;
    if (!payload.request || !payload.request.id || !portalToken ||
        !payload.request.items || !payload.request.items[0]) {
        throw new Error('Benchmark setup did not return request and portal identifiers for VU ' + index);
    }

    account.requestId = payload.request.id;
    account.itemId = payload.request.items[0].id;
    account.portalToken = portalToken;
}

export function setup() {
    if (WORKLOAD_GROUP === 'landing') {
        return { accounts: [] };
    }

    const accounts = [];
    for (let index = 1; index <= TARGET_VUS; index += 1) {
        const account = registerAccount(index);
        if (WORKLOAD_GROUP === 'owner' || WORKLOAD_GROUP === 'client') {
            createRequest(account, index);
        }
        accounts.push(account);
    }

    return { accounts: accounts };
}

let authCookie = null;
let clientUploadDone = false;

export default function (data) {
    const account = WORKLOAD_GROUP === 'landing' ? null : data.accounts[__VU - 1];
    if (WORKLOAD_GROUP !== 'landing' && !account) {
        throw new Error('No benchmark account was prepared for VU ' + __VU);
    }

    if (WORKLOAD_GROUP === 'landing') {
        const response = http.get(BASE_URL + '/', { tags: { endpoint: 'landing' } });
        success.landing.add(check(response, {
            'landing returns HTTP 200': (res) => res.status === 200,
        }));
        return;
    }

    if (WORKLOAD_GROUP === 'auth') {
        if (!authCookie) {
            const login = http.post(BASE_URL + '/api/v1/auth/login', JSON.stringify({
                email: account.email,
                password: account.password,
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-IP': account.clientIp,
                },
                tags: { endpoint: 'auth_login' },
            });
            const loginOk = check(login, {
                'auth login returns HTTP 200': (res) => res.status === 200,
            });
            success.authLogin.add(loginOk);
            if (!loginOk) {
                return;
            }
            const loginCookie = login.cookies.sendocs_session && login.cookies.sendocs_session[0];
            if (!loginCookie) {
                success.authSession.add(false);
                return;
            }
            authCookie = 'sendocs_session=' + loginCookie.value;
        }

        const session = http.get(BASE_URL + '/api/v1/auth/session', {
            headers: {
                Cookie: authCookie,
                'X-Client-IP': account.clientIp,
            },
            tags: { endpoint: 'auth_session' },
        });
        success.authSession.add(check(session, {
            'auth session returns HTTP 200': (res) => res.status === 200,
        }));
        // The session route is limited to 120 requests/minute per user.
        sleep(0.55);
        return;
    }

    if (WORKLOAD_GROUP === 'owner') {
        if (__ITER % 2 === 0) {
            const list = http.get(BASE_URL + '/api/v1/requests', {
                headers: {
                    Cookie: account.cookie,
                    'X-Client-IP': account.clientIp,
                },
                tags: { endpoint: 'owner_request_list' },
            });
            success.ownerList.add(check(list, {
                'owner request list returns HTTP 200': (res) => res.status === 200,
            }));
        } else {
            const detail = http.get(BASE_URL + '/api/v1/requests/' + account.requestId, {
                headers: {
                    Cookie: account.cookie,
                    'X-Client-IP': account.clientIp,
                },
                tags: { endpoint: 'owner_request_detail' },
            });
            success.ownerDetail.add(check(detail, {
                'owner request detail returns HTTP 200': (res) => res.status === 200,
            }));
        }
        // Both owner read routes share a 120 requests/minute per-user limit.
        sleep(0.55);
        return;
    }

    if (!clientUploadDone) {
        const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';
        const upload = http.post(
            BASE_URL + '/api/v1/portal/' + account.portalToken + '/items/' + account.itemId + '/file',
            { file: http.file(pdfContent, 'benchmark.pdf', 'application/pdf') },
            {
                headers: { 'X-Client-IP': account.clientIp },
                tags: { endpoint: 'client_upload' },
            }
        );
        clientUploadDone = check(upload, {
            'client upload returns HTTP 200': (res) => res.status === 200,
        });
        success.clientUpload.add(clientUploadDone);
        if (!clientUploadDone) {
            return;
        }
    }

    const portal = http.get(BASE_URL + '/api/v1/portal/' + account.portalToken, {
        headers: { 'X-Client-IP': account.clientIp },
        tags: { endpoint: 'client_portal' },
    });
    success.clientPortal.add(check(portal, {
        'client portal returns HTTP 200': (res) => res.status === 200,
    }));
    // The portal read route is limited to 60 requests/minute per source IP.
    sleep(1.1);
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
