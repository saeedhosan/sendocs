import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import exec from 'k6/execution';
import { Counter } from 'k6/metrics';

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const password = 'benchmark-password-123';
const identities = JSON.parse(open('./scalability-results/owners.json'));

const portalReads = new Counter('client_portal_reads');
const portalUploads = new Counter('client_portal_uploads');
const loginRequests = new Counter('auth_login_requests');
const registrationRequests = new Counter('auth_registration_requests');

let ownerState = null;

export const options = {
    scenarios: {
        owner_load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 100 },
                { duration: '10s', target: 250 },
                { duration: '10s', target: 500 },
                { duration: '15s', target: 1000 },
                { duration: '30s', target: 1000 },
                { duration: '10s', target: 0 },
            ],
            gracefulRampDown: '10s',
            exec: 'ownerJourney',
        },
        auth_burst: {
            executor: 'per-vu-iterations',
            vus: 10,
            iterations: 1,
            maxDuration: '30s',
            startTime: '10s',
            exec: 'authJourney',
        },
    },
    thresholds: {
        checks: ['rate>0.99'],
        http_req_failed: ['rate<0.01'],
    },
};

export function ownerJourney() {
    const ownerIndex = exec.vu.idInTest - 1;
    const owner = identities[ownerIndex];

    if (!owner) {
        fail(`No seeded owner identity for VU ${exec.vu.idInTest}`);
    }

    if (ownerState === null) {
        http.cookieJar().set(baseUrl, 'sendocs_session', owner.cookie, { path: '/' });
        ownerState = { requestId: null, token: null, itemId: null, portalChecked: false };
    }

    const home = http.get(`${baseUrl}/`, { tags: { area: 'home' } });
    check(home, { 'home route returns 200': (r) => r.status === 200 });

    const dashboard = http.get(`${baseUrl}/dashboard`, { tags: { area: 'home' } });
    check(dashboard, { 'dashboard shell returns 200': (r) => r.status === 200 });

    const session = http.get(`${baseUrl}/api/v1/auth/session`, {
        headers: { Accept: 'application/json' },
        tags: { area: 'auth' },
    });
    check(session, { 'owner session resolves': (r) => r.status === 200 });

    const list = http.get(`${baseUrl}/api/v1/requests?limit=20`, {
        headers: { Accept: 'application/json' },
        tags: { area: 'owner' },
    });
    check(list, { 'owner request list returns 200': (r) => r.status === 200 });

    if (ownerState.requestId === null) {
        const created = http.post(
            `${baseUrl}/api/v1/requests`,
            JSON.stringify({
                title: `k6 request for owner ${ownerIndex + 1}`,
                items: [
                    { label: 'Proof of identity' },
                    { label: 'Proof of address' },
                ],
            }),
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': owner.csrfToken,
                },
                tags: { area: 'owner' },
            },
        );

        if (!check(created, { 'owner request creation returns 201': (r) => r.status === 201 })) {
            fail(`Request creation failed for VU ${exec.vu.idInTest}: ${created.status} ${created.body}`);
        }

        const requestId = created.json('request.id');
        const portalUrl = created.json('link.url');
        const token = typeof portalUrl === 'string' ? portalUrl.split('/').pop() : '';

        if (!requestId || !token) {
            fail(`Request response missing request id or client link for VU ${exec.vu.idInTest}`);
        }

        ownerState.requestId = requestId;
        ownerState.token = token;
    }

    const detail = http.get(`${baseUrl}/api/v1/requests/${ownerState.requestId}`, {
        headers: { Accept: 'application/json' },
        tags: { area: 'owner' },
    });
    check(detail, { 'owner request detail returns 200': (r) => r.status === 200 });

    // The client portal is IP-rate-limited. The shared runner has one egress IP,
    // so exercise the documented per-IP budget rather than generating artificial 429s.
    if (ownerIndex < 60 && !ownerState.portalChecked) {
        const portal = http.get(`${baseUrl}/api/v1/portal/${ownerState.token}`, {
            headers: { Accept: 'application/json' },
            tags: { area: 'client' },
        });
        portalReads.add(1);
        check(portal, { 'client portal lookup returns 200': (r) => r.status === 200 });

        const itemId = portal.json('items.0.id');
        if (!itemId) {
            fail(`Client portal response missing item id for VU ${exec.vu.idInTest}`);
        }

        ownerState.itemId = itemId;
        ownerState.portalChecked = true;

        // Upload is limited to 30 requests/hour per source IP. Keep this burst
        // within the real application limit on the single GitHub runner address.
        if (ownerIndex < 30) {
            const pdf = '%PDF-1.7\\n1 0 obj\\n<< /Type /Catalog >>\\nendobj\\n%%EOF\\n';
            const upload = http.post(
                `${baseUrl}/api/v1/portal/${ownerState.token}/items/${ownerState.itemId}/file`,
                { file: http.file(pdf, 'identity.pdf', 'application/pdf') },
                {
                    headers: { Accept: 'application/json' },
                    tags: { area: 'client' },
                },
            );
            portalUploads.add(1);
            check(upload, {
                'client document upload returns 200': (r) => r.status === 200,
                'upload updates progress': (r) => r.json('uploaded') === 1,
                'uploaded item is marked uploaded': (r) => r.json('items.0.state') === 'uploaded',
            });
        }
    }

    sleep(2 + Math.random() * 3);
}

export function authJourney() {
    const identityIndex = 1000 + ((exec.vu.idInTest - 1) % 10);
    const identity = identities[identityIndex];

    if (!identity) {
        fail(`No seeded authentication identity for VU ${exec.vu.idInTest}`);
    }

    const loginPage = http.get(`${baseUrl}/login`, { tags: { area: 'home' } });
    check(loginPage, { 'login page returns 200': (r) => r.status === 200 });

    const login = http.post(
        `${baseUrl}/api/v1/auth/login`,
        JSON.stringify({ email: identity.email, password }),
        {
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            tags: { area: 'auth' },
        },
    );
    loginRequests.add(1);
    check(login, {
        'owner login returns 200': (r) => r.status === 200,
        'login returns a CSRF token': (r) => typeof r.json('csrfToken') === 'string',
    });

    const session = http.get(`${baseUrl}/api/v1/auth/session`, {
        headers: { Accept: 'application/json' },
        tags: { area: 'auth' },
    });
    check(session, { 'logged-in session resolves': (r) => r.status === 200 });

    const registration = http.post(
        `${baseUrl}/api/v1/auth/register`,
        JSON.stringify({
            name: 'k6 registration burst',
            email: `k6-register-${Date.now()}-${identityIndex}@example.test`,
            password,
        }),
        {
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            tags: { area: 'auth' },
        },
    );
    registrationRequests.add(1);
    check(registration, {
        'owner registration returns 201': (r) => r.status === 201,
        'registration returns a CSRF token': (r) => typeof r.json('csrfToken') === 'string',
    });
}

function number(value, digits = 1) {
    return typeof value === 'number' ? value.toFixed(digits) : 'N/A';
}

export function handleSummary(data) {
    const metrics = data.metrics || {};
    const checks = metrics.checks?.values || {};
    const failed = metrics.http_req_failed?.values || {};
    const duration = metrics.http_req_duration?.values || {};
    const requests = metrics.http_reqs?.values || {};
    const iterations = metrics.iterations?.values || {};
    const journey = metrics.iteration_duration?.values || {};
    const vus = metrics.vus?.values || {};
    const vusMax = metrics.vus_max?.values || {};
    const dropped = metrics.dropped_iterations?.values || {};

    const passedChecks = checks.passes || 0;
    const failedChecks = checks.fails || 0;
    const totalChecks = passedChecks + failedChecks;
    const checkRate = totalChecks > 0 ? passedChecks / totalChecks : 0;
    const errorRate = typeof failed.rate === 'number' ? failed.rate : null;
    const maxVus = vusMax.max ?? vus.max ?? 0;
    const targetReached = maxVus >= 1000;
    const result = targetReached && checkRate > 0.99 && errorRate !== null && errorRate < 0.01
        ? 'Passed'
        : 'Failed';

    const runId = __ENV.GITHUB_RUN_ID || 'local';
    const repository = __ENV.GITHUB_REPOSITORY || '';
    const server = __ENV.GITHUB_SERVER_URL || 'https://github.com';
    const commit = __ENV.GITHUB_SHA || '';
    const commitShort = commit ? commit.slice(0, 7) : 'unknown';
    const runUrl = repository ? `${server}/${repository}/actions/runs/${runId}` : '';
    const commitUrl = repository && commit ? `${server}/${repository}/commit/${commit}` : '';
    const commitLabel = commitUrl ? '[' + '`' + commitShort + '`' + '](' + commitUrl + ')' : '`' + commitShort + '`';
    const runLabel = runUrl ? ` · [Workflow run](${runUrl})` : '';

    const report = [
        `<!-- benchmark-run: ${runId} -->`,
        `### Results — ${new Date().toISOString()}`,
        '',
        `**Outcome:** ${result}  `,
        `**Scenario:** ${__ENV.BENCHMARK_SCENARIO || 'Not specified'}  `,
        `**Concurrent owner target:** ${__ENV.BENCHMARK_CONCURRENT_OWNER_TARGET || 'Not specified'}  `,
        `**Workload:** ${__ENV.BENCHMARK_WORKLOAD || 'Not specified'}  `,
        `**Commit:** ${commitLabel}${runLabel}`,
        '',
        '| Metric | Result |',
        '|---|---:|',
        `| HTTP requests | ${requests.count ?? 'N/A'} |`,
        `| Average throughput | ${number(requests.rate, 1)} requests/s |`,
        `| Maximum concurrent VUs (owners + auth burst) | ${number(maxVus, 0)} |`,
        `| Iterations | ${iterations.count ?? 'N/A'} |`,
        `| Average latency | ${number(duration.avg)} ms |`,
        `| p95 latency | ${number(duration['p(95)'])} ms |`,
        `| HTTP error rate | ${errorRate === null ? 'N/A' : (errorRate * 100).toFixed(2) + '%'} |`,
        `| Dropped iterations | ${dropped.count ?? 0} |`,
        `| Functional checks | ${totalChecks ? `${passedChecks}/${totalChecks} (${(checkRate * 100).toFixed(1)}%)` : 'N/A'} |`,
        `| Average journey duration | ${number(journey.avg)} ms |`,
        `| Authentication logins / registrations | ${metrics.auth_login_requests?.values?.count ?? 0} / ${metrics.auth_registration_requests?.values?.count ?? 0} |`,
        `| Client portal reads / uploads | ${metrics.client_portal_reads?.values?.count ?? 0} / ${metrics.client_portal_uploads?.values?.count ?? 0} |`,
        '',
        `**Runner:** ${__ENV.RUNNER_OS || 'N/A'}/${__ENV.RUNNER_ARCH || 'N/A'} · ${__ENV.RUNNER_CPU_COUNT || 'N/A'} vCPU · ${__ENV.RUNNER_MEMORY_GB || 'N/A'} GB RAM`,
        '',
        '> App and k6 share a GitHub-hosted runner. All synthetic clients share its egress IP, so portal traffic is capped at the documented 60 reads/minute and 30 uploads/hour; login and registration bursts are capped at 10 requests/minute each. Results are not production-capacity claims.',
        '',
    ].join('\\n');

    const output = {
        'scalability-results/benchmark-entry.md': report,
    };
    if (__ENV.GITHUB_STEP_SUMMARY) {
        output[__ENV.GITHUB_STEP_SUMMARY] = report;
    }
    return output;
}
