import { browser } from 'k6/browser';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const REGISTER_PASSWORD = 'StrongPass123!';
const TARGET_SCALE_USER = Number(__ENV.TARGET_SCALE_USER || 1000);

if (!Number.isSafeInteger(TARGET_SCALE_USER) || TARGET_SCALE_USER < 1) {
    throw new Error('TARGET_SCALE_USER must be a positive integer.');
}

const journeysCompleted = new Counter('browser_journeys_completed');
const journeyDuration = new Trend('browser_journey_duration', true);

const PDF_BASE64 = 'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0OSA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDIwIDEwMCBUZCAoU2VuZG9jcyBsb2FkIHRlc3QpIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0MSAwMDAwMCBuIAowMDAwMDAwMzM5IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDA5CiUlRU9GCg==';

export const options = {
    scenarios: {
        browser_journeys: {
            executor: 'per-vu-iterations',
            vus: TARGET_SCALE_USER,
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

        // Each browser user creates and uses its own account through the UI.
        await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
        await page.locator('input[name="name"]').fill('Sendocs Browser Benchmark');
        await page.locator('input[name="email"]').fill(
            `browser-${__ENV.GITHUB_RUN_ID || Date.now()}-${__ENV.GITHUB_RUN_ATTEMPT || '1'}-${__VU}@example.test`,
        );
        await page.locator('input[name="password"]').fill(REGISTER_PASSWORD);
        await page.locator('input[name="confirmPassword"]').fill(REGISTER_PASSWORD);
        await page.locator('button[type="submit"]').click();

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

    const passed = completed === TARGET_SCALE_USER
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

    const timestamp = new Date().toISOString().slice(0, 10);
    const testDuration = data.state && typeof data.state.testRunDurationMs === 'number'
        ? (data.state.testRunDurationMs / 1000).toFixed(1) + 's'
        : '—';
    const checkResult = checkRate === null ? '—' : (checkRate * 100).toFixed(1) + '%';
    const requestLatency = browserRequests && typeof browserRequests['p(95)'] === 'number'
        ? formatMetric(browserRequests['p(95)'], ' ms')
        : '—';
    const requestFailures = requestFailureRate === null
        ? '—'
        : formatMetric(requestFailureRate * 100, '%');
    const journeyLatency = journey && typeof journey['p(95)'] === 'number'
        ? formatMetric(journey['p(95)'], ' ms')
        : '—';
    const testMachine = __ENV.RUNNER_CPU_COUNT && __ENV.RUNNER_MEMORY_GB
        ? 'GitHub Actions · ' + __ENV.RUNNER_CPU_COUNT + ' vCPU · ' + __ENV.RUNNER_MEMORY_GB + ' GB RAM'
        : '—';

    const lines = [
        '### Scalability Test - ' + timestamp,
        '',
        '- **Result:** ' + (passed ? 'Passed' : 'Failed'),
        '- **Load target:** ' + TARGET_SCALE_USER.toLocaleString() + ' concurrent users',
        '- **Test machine:** ' + testMachine,
        '- **Test scenario:** Complete user journeys through the Sendocs application.',
        '- **User journey:** Registration → Dashboard → Create request → Client document upload.',
        '- **Evidence:** [Workflow run](' + (runUrl || '#') + ') · [Commit](' + (commitUrl || '#') + ')',
        '',
        '| Metric | Result |',
        '| -------------------------------- | --------: |',
        '| Peak concurrent users | ' + maxVus.toLocaleString() + ' |',
        '| Completed user journeys | ' + completed.toLocaleString() + ' / ' + TARGET_SCALE_USER.toLocaleString() + ' |',
        '| Functional checks | ' + checkResult + ' |',
        '| Browser request latency (p95) | ' + requestLatency + ' |',
        '| Browser request failure rate | ' + requestFailures + ' |',
        '| End-to-end journey latency (p95) | ' + journeyLatency + ' |',
        '| Test duration | ' + testDuration + ' |',
        '',
    ];

    const report = lines.join('\n');
    const output = {
        'scalability-results/benchmark-entry.md': report,
        stdout: report,
    };

    if (__ENV.GITHUB_STEP_SUMMARY) {
        output[__ENV.GITHUB_STEP_SUMMARY] = report;
    }

    return output;
}
