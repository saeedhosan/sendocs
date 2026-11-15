import { browser } from 'k6/browser';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const SEEDED_OWNERS = JSON.parse(open(__ENV.SEEDED_OWNERS_FILE));
const PASSWORD = 'benchmark-password-123';
const REGISTER_PASSWORD = 'StrongPass123!';

const journeysCompleted = new Counter('browser_journeys_completed');
const journeyDuration = new Trend('browser_journey_duration', true);

const PDF_BASE64 = 'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0OSA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDIwIDEwMCBUZCAoU2VuZG9jcyBsb2FkIHRlc3QpIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0MSAwMDAwMCBuIAowMDAwMDAwMzM5IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDA5CiUlRU9GCg==';

export const options = {
    scenarios: {
        browser_journeys: {
            executor: 'per-vu-iterations',
            vus: 5,
            iterations: 1,
            maxDuration: '5m',
            options: {
                browser: {
                    type: 'chromium',
                },
            },
        },
    },
    thresholds: {
        checks: ['rate==1'],
        browser_http_req_failed: ['rate<0.01'],
    },
};

export default async function () {
    const page = await browser.newPage();
    const startedAt = Date.now();
    const requestTitle = `Browser journey ${__ENV.GITHUB_RUN_ID || 'local'}-${__ENV.GITHUB_RUN_ATTEMPT || '1'}-${__VU}`;

    try {
        // Public landing page.
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        await page.locator('body').waitFor({ state: 'visible' });
        const landingText = await page.locator('body').textContent();
        check(landingText, {
            'landing page renders in Chromium': (value) => Boolean(value && value.trim().length > 0),
        });

        // Visit all public authentication screens in every browser session.
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
        await page.locator('input[name="email"]').waitFor({ state: 'visible' });

        await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
        await page.locator('input[name="email"]').waitFor({ state: 'visible' });

        await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'domcontentloaded' });
        await page.locator('body').waitFor({ state: 'visible' });

        // Three VUs register through the UI; two sign in with isolated seeded accounts.
        if (__VU <= 3) {
            await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
            await page.locator('input[name="name"]').fill('Sendocs Browser Benchmark');
            await page.locator('input[name="email"]').fill(
                `browser-${__ENV.GITHUB_RUN_ID || Date.now()}-${__ENV.GITHUB_RUN_ATTEMPT || '1'}-${__VU}@example.test`,
            );
            await page.locator('input[name="password"]').fill(REGISTER_PASSWORD);
            await page.locator('input[name="confirmPassword"]').fill(REGISTER_PASSWORD);
            await page.locator('button[type="submit"]').click();
        } else {
            const owner = SEEDED_OWNERS[__VU - 4];

            await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
            await page.locator('input[name="email"]').fill(owner.email);
            await page.locator('input[name="password"]').fill(PASSWORD);
            await page.locator('button[type="submit"]').click();
        }

        await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 30000 });
        await page.getByRole('heading', { name: 'Document Requests' }).waitFor({
            state: 'visible',
            timeout: 30000,
        });
        check(true, { 'owner dashboard loads after authentication': (value) => value === true });

        // Visit every protected owner screen without submitting destructive settings forms.
        await page.goto(`${BASE_URL}/account`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: 'Account', exact: true }).waitFor({ state: 'visible' });
        check(true, { 'owner account page loads': (value) => value === true });

        await page.goto(`${BASE_URL}/settings/password`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: 'Change password', exact: true }).waitFor({ state: 'visible' });
        check(true, { 'owner password settings page loads': (value) => value === true });

        await page.goto(`${BASE_URL}/settings/delete`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: 'Delete account', exact: true }).waitFor({ state: 'visible' });
        check(true, { 'owner account deletion page loads without submitting': (value) => value === true });

        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: 'Document Requests' }).waitFor({ state: 'visible' });

        // Create a real request through the owner UI and capture its one-time portal link.
        await page.getByRole('button', { name: 'New request' }).click();
        await page.locator('#request-title').fill(requestTitle);
        await page.locator('input[aria-label="Document 1"]').fill('Proof of address');
        await page.getByRole('button', { name: 'Create request' }).click();

        const linkInput = page.locator('input[aria-label="Client portal link"]');
        await linkInput.waitFor({ state: 'visible', timeout: 30000 });
        const portalUrl = await linkInput.inputValue();
        check(portalUrl, {
            'owner receives a client portal link': (value) => value.includes('/portal/'),
        });

        // Open the created request detail page from the owner list.
        await page.getByRole('button', { name: 'Done' }).click();
        await page.getByRole('link', { name: requestTitle, exact: true }).click();
        await page.getByRole('heading', { name: requestTitle }).waitFor({
            state: 'visible',
            timeout: 30000,
        });
        check(true, { 'owner request detail page loads': (value) => value === true });

        // Follow the actual one-time link in Chromium and upload a valid PDF.
        await page.goto(portalUrl, { waitUntil: 'domcontentloaded' });
        await page.locator('input[type="file"]').waitFor({ state: 'attached', timeout: 30000 });
        await page.setInputFiles('input[type="file"]', {
            name: 'proof-of-address.pdf',
            mimeType: 'application/pdf',
            buffer: PDF_BASE64,
        });
        await page.getByText('All documents received').waitFor({
            state: 'visible',
            timeout: 30000,
        });
        check(true, { 'client portal upload completes in browser': (value) => value === true });

        journeyDuration.add(Date.now() - startedAt);
        journeysCompleted.add(1);
    } finally {
        await page.close();
    }
}

function metricValue(data, name, key) {
    const values = data.metrics[name] && data.metrics[name].values;
    return values && values[key] !== undefined ? values[key] : null;
}

function formatMetric(value, suffix = '') {
    return value === null ? null : `${value.toFixed(2)}${suffix}`;
}

export function handleSummary(data) {
    const checks = data.metrics.checks && data.metrics.checks.values;
    const browserRequests = data.metrics.browser_http_req_duration && data.metrics.browser_http_req_duration.values;
    const failedRequests = data.metrics.browser_http_req_failed && data.metrics.browser_http_req_failed.values;
    const lcp = data.metrics.browser_web_vital_lcp && data.metrics.browser_web_vital_lcp.values;
    const journey = data.metrics.browser_journey_duration && data.metrics.browser_journey_duration.values;
    const vus = data.metrics.vus && data.metrics.vus.values;
    const completed = metricValue(data, 'browser_journeys_completed', 'count') || 0;

    const passedChecks = checks ? checks.passes || 0 : 0;
    const failedChecks = checks ? checks.fails || 0 : 0;
    const totalChecks = passedChecks + failedChecks;
    const checkRate = totalChecks ? passedChecks / totalChecks : null;
    const requestFailureRate = failedRequests && typeof failedRequests.rate === 'number'
        ? failedRequests.rate
        : null;
    const maxVus = vus && typeof vus.max === 'number' ? vus.max : 0;

    const passed = completed === 5
        && checkRate === 1
        && requestFailureRate !== null
        && requestFailureRate < 0.01;

    const runId = __ENV.GITHUB_RUN_ID || 'local';
    const repository = __ENV.GITHUB_REPOSITORY || '';
    const server = __ENV.GITHUB_SERVER_URL || 'https://github.com';
    const commit = __ENV.GITHUB_SHA || '';
    const commitShort = commit ? commit.slice(0, 7) : 'unknown';
    const runUrl = repository ? `${server}/${repository}/actions/runs/${runId}` : '';
    const commitUrl = repository && commit ? `${server}/${repository}/commit/${commit}` : '';
    const commitLabel = commitUrl ? '[`' + commitShort + '`](' + commitUrl + ')' : '`' + commitShort + '`';
    const runLabel = runUrl ? ` · [Workflow run](${runUrl})` : '';

    const lines = [
        `<!-- benchmark-run: ${runId} -->`,
        `### Browser results — ${new Date().toISOString()}`,
        '',
        `**Outcome:** ${passed ? 'Passed' : 'Failed'}  `,
        '**Scenario:** 5 concurrent Chromium users completing one journey each  ',
        `**Commit:** ${commitLabel}${runLabel}`,
        '',
        '| Metric | Result |',
        '|---|---:|',
        `| Browser journeys completed | ${completed}/5 |`,
        `| Concurrent browser VUs reached | ${maxVus} |`,
        `| Functional checks | ${totalChecks ? `${passedChecks}/${totalChecks} (${(checkRate * 100).toFixed(1)}%)` : '0'} |`,
    ];

    if (browserRequests && typeof browserRequests.count === 'number') {
        lines.push(`| Browser requests | ${browserRequests.count} |`);
    }
    if (browserRequests && typeof browserRequests['p(95)'] === 'number') {
        lines.push(`| Browser request p95 | ${formatMetric(browserRequests['p(95)'], ' ms')} |`);
    }
    if (requestFailureRate !== null) {
        lines.push(`| Browser request failure rate | ${formatMetric(requestFailureRate * 100, '%')} |`);
    }
    if (journey && typeof journey['p(95)'] === 'number') {
        lines.push(`| End-to-end journey p95 | ${formatMetric(journey['p(95)'], ' ms')} |`);
    }
    if (lcp && typeof lcp['p(95)'] === 'number') {
        lines.push(`| Largest Contentful Paint p95 | ${formatMetric(lcp['p(95)'], ' ms')} |`);
    }
    if (__ENV.RUNNER_CPU_COUNT && __ENV.RUNNER_MEMORY_GB) {
        lines.push(`| GitHub runner | ${__ENV.RUNNER_CPU_COUNT} vCPU / ${__ENV.RUNNER_MEMORY_GB} GB RAM |`);
    }

    lines.push(
        '',
        'Journey: landing → login/register/forgot password → owner dashboard → account/settings → create request → request detail → client portal → PDF upload.',
        '',
    );

    const report = lines.join('\\n');
    const output = {
        'scalability-results/benchmark-entry.md': report,
        stdout: report,
    };

    if (__ENV.GITHUB_STEP_SUMMARY) {
        output[__ENV.GITHUB_STEP_SUMMARY] = report;
    }

    return output;
}
