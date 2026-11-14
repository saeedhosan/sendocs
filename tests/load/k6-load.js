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
    const identity = `k6-smoke-${Date.now()}-${__ITER}@example.test`;
    const password = 'benchmark-password-123';

    const registration = http.post(
        `${baseUrl}/api/v1/auth/register`,
        JSON.stringify({
            name: 'k6 Smoke Owner',
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
            title: 'k6 smoke request',
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
