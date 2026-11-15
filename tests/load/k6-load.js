import http from 'k6/http';
import { check, fail } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8000';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        checks: ['rate==1'],
        http_req_failed: ['rate==0'],
    },
};

export default function () {
    const identity = `k6-load-${Date.now()}-${__ITER}@example.test`;
    const password = 'benchmark-password-123';

    const registration = http.post(
        `${baseUrl}/api/v1/auth/register`,
        JSON.stringify({
            name: 'k6 Load Owner',
            email: identity,
            password,
        }),
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
    );

    if (!check(registration, { 'owner registration returns 201': (r) => r.status === 201 })) {
        fail(`Owner registration failed: ${registration.status} ${registration.body}`);
    }

    const session = registration.json();
    const csrfToken = session.csrfToken;

    if (!check(csrfToken, { 'registration returns a CSRF token': (token) => typeof token === 'string' && token.length > 0 })) {
        fail('Registration response did not contain csrfToken');
    }

    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
    };

    const list = http.get(`${baseUrl}/api/v1/requests`, { headers: { Accept: 'application/json' } });
    check(list, { 'owner request list returns 200': (r) => r.status === 200 });

    const created = http.post(
        `${baseUrl}/api/v1/requests`,
        JSON.stringify({
            title: 'k6 load request',
            items: [
                { label: 'Proof of identity' },
                { label: 'Proof of address' },
            ],
        }),
        { headers },
    );

    if (!check(created, { 'owner request creation returns 201': (r) => r.status === 201 })) {
        fail(`Request creation failed: ${created.status} ${created.body}`);
    }

    const requestId = created.json('request.id');
    const portalUrl = created.json('link.url');
    const token = typeof portalUrl === 'string' ? portalUrl.split('/').pop() : '';

    check(requestId, { 'created request contains an id': (id) => typeof id === 'string' && id.length > 0 });
    if (!token) {
        fail('Created request response did not contain a portal token');
    }

    const detail = http.get(`${baseUrl}/api/v1/requests/${requestId}`, {
        headers: { Accept: 'application/json' },
    });
    check(detail, { 'owner request detail returns 200': (r) => r.status === 200 });

    const portal = http.get(`${baseUrl}/api/v1/portal/${token}`, {
        headers: { Accept: 'application/json' },
    });
    check(portal, { 'client portal lookup returns 200': (r) => r.status === 200 });

    const itemId = portal.json('items.0.id');
    if (!itemId) {
        fail('Client portal response did not contain a request item');
    }

    const pdf = '%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n';
    const upload = http.post(
        `${baseUrl}/api/v1/portal/${token}/items/${itemId}/file`,
        { file: http.file(pdf, 'identity.pdf', 'application/pdf') },
        { headers: { Accept: 'application/json' } },
    );

    check(upload, {
        'client document upload returns 200': (r) => r.status === 200,
        'uploaded document updates portal progress': (r) => r.json('uploaded') === 1,
        'uploaded document is marked uploaded': (r) => r.json('items.0.state') === 'uploaded',
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

    const passedChecks = checks.passes || 0;
    const failedChecks = checks.fails || 0;
    const totalChecks = passedChecks + failedChecks;
    const errorRate = typeof failed.rate === 'number' ? `${(failed.rate * 100).toFixed(2)}%` : 'N/A';
    const result = totalChecks > 0 && passedChecks === totalChecks && failed.rate === 0
        ? 'Passed'
        : totalChecks > 0 || typeof failed.rate === 'number' ? 'Failed' : 'Inconclusive';

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
        `**DAU target:** ${__ENV.BENCHMARK_DAU_TARGET || 'Not tested'}  `,
        `**Workload:** ${__ENV.BENCHMARK_WORKLOAD || 'Not specified'}  `,
        `**Commit:** ${commitLabel}${runLabel}`,
        '',
        '| Metric | Result |',
        '|---|---:|',
        `| HTTP requests | ${requests.count ?? 'N/A'} |`,
        `| Iterations | ${iterations.count ?? 'N/A'} |`,
        `| Average latency | ${number(duration.avg)} ms |`,
        `| p95 latency | ${number(duration['p(95)'])} ms |`,
        `| HTTP error rate | ${errorRate} |`,
        `| Functional checks | ${totalChecks ? `${passedChecks}/${totalChecks} (${(passedChecks / totalChecks * 100).toFixed(1)}%)` : 'N/A'} |`,
        `| Average journey duration | ${number(journey.avg)} ms |`,
        '',
        `**Runner:** ${__ENV.RUNNER_OS || 'N/A'}/${__ENV.RUNNER_ARCH || 'N/A'} · ${__ENV.RUNNER_CPU_COUNT || 'N/A'} vCPU · ${__ENV.RUNNER_MEMORY_GB || 'N/A'} GB RAM`,
        '',
        '> Results describe this workload on a shared GitHub-hosted runner. A functional baseline is not evidence of DAU capacity or production-server capacity.',
        '',
    ].join('\n');

    const output = {
        'scalability-results/benchmark-entry.md': report,
    };
    if (__ENV.GITHUB_STEP_SUMMARY) {
        output[__ENV.GITHUB_STEP_SUMMARY] = report;
    }
    return output;
}
