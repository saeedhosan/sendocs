import http from 'k6/http';
import { BASE_URL, PASSWORD, WORKLOAD_GROUP } from '../config.js';

// 198.18.0.0/15 is reserved for benchmarking. Each test account/VU gets one address.
function clientIp(index) {
    const offset = index;
    return '198.' + (18 + Math.floor(offset / 65536)) + '.' +
        Math.floor((offset % 65536) / 256) + '.' + (offset % 256);
}

export function registerAccount(index) {
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

export function createRequest(account, index) {
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

export function prepareAccounts(createRequests) {
    const accounts = [];
    const targetVus = Number(__ENV.TARGET_VUS || 100);

    for (let index = 1; index <= targetVus; index += 1) {
        const account = registerAccount(index);
        if (createRequests) {
            createRequest(account, index);
        }
        accounts.push(account);
    }

    return { accounts: accounts };
}
