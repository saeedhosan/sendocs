import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../config.js';
import { Rate } from 'k6/metrics';
import { prepareAccounts } from '../helpers/accounts.js';

export const clientUploadSuccess = new Rate('client_upload_success');
export const clientPortalSuccess = new Rate('client_portal_success');

export function setup() {
    return prepareAccounts(true);
}

let clientUploadDone = false;

export default function (data) {
    const account = data.accounts[__VU - 1];
    if (!account) {
        throw new Error('No benchmark account was prepared for VU ' + __VU);
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
        clientUploadSuccess.add(clientUploadDone);
        if (!clientUploadDone) {
            return;
        }
    }

    const portal = http.get(BASE_URL + '/api/v1/portal/' + account.portalToken, {
        headers: { 'X-Client-IP': account.clientIp },
        tags: { endpoint: 'client_portal' },
    });
    clientPortalSuccess.add(check(portal, {
        'client portal returns HTTP 200': (res) => res.status === 200,
    }));
    // The portal read route is limited to 60 requests/minute per source IP.
    sleep(1.1);
}
