import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const TARGET_VUS = Number(process.env.TARGET_VUS || 100);
const WORKLOAD_GROUP = process.env.WORKLOAD_GROUP || 'auth';
const PASSWORD = 'Benchmark-pass-123!';
const GROUPS = ['auth', 'owner', 'client'];

if (!GROUPS.includes(WORKLOAD_GROUP)) throw new Error('Invalid WORKLOAD_GROUP.');
if (!Number.isSafeInteger(TARGET_VUS) || TARGET_VUS < 1) throw new Error('TARGET_VUS must be positive.');

function clientIp(index) {
    return '198.' + (18 + Math.floor(index / 65536)) + '.' +
        Math.floor((index % 65536) / 256) + '.' + (index % 256);
}

async function request(path, options, expectedStatus) {
    const response = await fetch(BASE_URL + path, options);
    const body = await response.text();
    if (response.status !== expectedStatus) {
        throw new Error('Setup ' + path + ' returned HTTP ' + response.status +
            ', expected ' + expectedStatus + ': ' + body.slice(0, 300));
    }
    return { response, payload: body ? JSON.parse(body) : {} };
}

async function registerAccount(index) {
    const email = 'k6-' + (process.env.GITHUB_RUN_ID || 'local') + '-' +
        WORKLOAD_GROUP + '-' + Date.now() + '-' + index + '@example.test';
    const ip = clientIp(index);
    const { response, payload } = await request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-IP': ip },
        body: JSON.stringify({
            name: 'k6 benchmark ' + WORKLOAD_GROUP + ' ' + index,
            email,
            password: PASSWORD,
        }),
    }, 201);

    const cookies = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [response.headers.get('set-cookie') || ''];
    const cookie = cookies.map((value) => value.split(';', 1)[0])
        .find((value) => value.startsWith('sendocs_session='));

    if (!cookie || !payload.csrfToken) {
        throw new Error('Registration did not return session cookie and CSRF token for VU ' + index);
    }

    return { email, password: PASSWORD, cookie, csrfToken: payload.csrfToken, clientIp: ip };
}

async function createRequest(account, index) {
    const { payload } = await request('/api/v1/requests', {
        method: 'POST',
        headers: {
            Cookie: account.cookie,
            'X-CSRF-Token': account.csrfToken,
            'X-Client-IP': account.clientIp,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: 'k6 ' + WORKLOAD_GROUP + ' benchmark ' + index,
            items: [{ label: 'Benchmark document ' + index }],
        }),
    }, 201);

    const linkUrl = payload.link && payload.link.url;
    const portalToken = linkUrl ? linkUrl.split('/').filter(Boolean).pop() : null;
    if (!payload.request?.id || !portalToken || !payload.request.items?.[0]) {
        throw new Error('Request setup did not return request and portal identifiers for VU ' + index);
    }

    account.requestId = payload.request.id;
    account.itemId = payload.request.items[0].id;
    account.portalToken = portalToken;
}

const accounts = [];
for (let index = 1; index <= TARGET_VUS; index += 1) {
    const account = await registerAccount(index);
    if (WORKLOAD_GROUP === 'owner' || WORKLOAD_GROUP === 'client') {
        await createRequest(account, index);
    }
    accounts.push(account);
    if (index % 250 === 0 || index === TARGET_VUS) {
        process.stdout.write('Prepared ' + index + '/' + TARGET_VUS + ' accounts\n');
    }
}

const outputPath = resolve('tests/load/accounts-' + WORKLOAD_GROUP + '.json');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(accounts));
process.stdout.write('Wrote ' + accounts.length + ' accounts to ' + outputPath + '\n');
