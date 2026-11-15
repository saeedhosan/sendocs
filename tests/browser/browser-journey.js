import { browser } from 'k6/browser';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const SEEDED_OWNERS = JSON.parse(open('./scalability-results/owners.json'));
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

function assertVisible(page, selector, name) {
    return page.locator(selector).waitFor({ state: 'visible', timeout: 30000 })
        .then(() => check(true, { [name]: (value) => value === true }));
}

export default async function () {
    const page = await browser.newPage();
    const startedAt = Date.now();
    const requestTitle = `Browser journey ${__ENV.GITHUB_RUN_ID || 'local'}-${__VU}`;

    try {
        // Public landing page.
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        await page.locator('body').waitFor({ state: 'visible' });
        const landingText = await page.locator('body').textContent();
        check(landingText, {
            'landing page renders in Chromium': (value) => Boolean(value && value.trim().length > 0),
        });

        // Three VUs register through the UI; two sign in with isolated seeded accounts.
        if (__VU <= 3) {
            await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
            await page.locator('input[name="name"]').fill('Sendocs Browser Benchmark');
            await page.locator('input[name="email"]').fill(
                `browser-${__ENV.GITHUB_RUN_ID || Date.now()}-${__VU}@example.test`,
            );
            await page.locator('input[name="password"]').fill(REGISTER_PASSWORD);
            await page.locator('input[name="confirmPassword"]').fill(REGISTER_PASSWORD);
            await page.locator('button[type="submit"]').click();
        } else {
            await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'domcontentloaded' });
            await page.locator('body').waitFor({ state: 'visible' });
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

        // Create a real request through the owner UI and capture its one-time portal link.
        await page.getByRole('button', { name: 'New request' }).click();
        await page.locator('#request-title').fill(requestTitle);
        await page.locator('input[aria-label="Document 1"]').fill('Proof of address');
        await page.getByRole('button', { name: 'Create request' }).click();

        const linkInput = page.locator('input[aria-label="Client portal link"]');
        await linkInput.waitFor({ state: 'visible', timeout: 30000 });
        const portalUrl = await linkInput.inputValue();
        check(portalUrl, {
            'owner receives a client portal link': (value) => value.startsWith(`${BASE_URL}/portal/`),
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
    const checksRate = metricValue(data, 'checks', 'rate');
    const completed = metricValue(data, 'browser_journeys_completed', 'count') || 0;
    const journeyP95 = metricValue(data, 'browser_journey_duration', 'p(95)');
    const browserRequestP95 = metricValue(data, 'browser_http_req_duration', 'p(95)');
    const lcpP95 = metricValue(data, 'browser_web_vital_lcp', 'p(95)');
    const failedRate = metricValue(data, 'browser_http_req_failed', 'rate');

    const lines = [
        `### Browser journey benchmark — ${new Date().toISOString()}`,
        '',
        '- **Scenario:** 5 concurrent Chromium users; one complete journey per user',
        '- **Journeys completed:** ' + completed,
        '- **Checks passed:** ' + (checksRate === null ? 'unavailable' : formatMetric(checksRate * 100, '%')),
        '- **Browser HTTP request failure rate:** ' + (failedRate === null ? 'unavailable' : formatMetric(failedRate * 100, '%')),
        '- **Journey duration (p95):** ' + (journeyP95 === null ? 'unavailable' : formatMetric(journeyP95, ' ms')),
        '- **Browser HTTP request duration (p95):** ' + (browserRequestP95 === null ? 'unavailable' : formatMetric(browserRequestP95, ' ms')),
        '- **Largest Contentful Paint (p95):** ' + (lcpP95 === null ? 'unavailable' : formatMetric(lcpP95, ' ms')),
        '- **Runner:** ' + (__ENV.RUNNER_CPU_COUNT || 'unknown') + ' vCPU, ' + (__ENV.RUNNER_MEMORY_GB || 'unknown') + ' GB RAM',
        '',
        'Journey: landing page → register/login → owner dashboard → create request → request detail → client portal → PDF upload.',
        '',
    ];

    const markdown = lines.join('\n');
    return {
        'scalability-results/browser-benchmark-entry.md': markdown,
        stdout: markdown,
    };
}
