import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../config.js';
import { Rate } from 'k6/metrics';
import { prepareAccounts } from '../helpers/accounts.js';

export const ownerListSuccess = new Rate('owner_list_success');
export const ownerDetailSuccess = new Rate('owner_detail_success');

export function setup() {
    return prepareAccounts(true);
}

export default function (data) {
    const account = data.accounts[__VU - 1];
    if (!account) {
        throw new Error('No benchmark account was prepared for VU ' + __VU);
    }

    if (__ITER % 2 === 0) {
        const list = http.get(BASE_URL + '/api/v1/requests', {
            headers: {
                Cookie: account.cookie,
                'X-Client-IP': account.clientIp,
            },
            tags: { endpoint: 'owner_request_list' },
        });
        ownerListSuccess.add(check(list, {
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
        ownerDetailSuccess.add(check(detail, {
            'owner request detail returns HTTP 200': (res) => res.status === 200,
        }));
    }
    // Both owner read routes share a 120 requests/minute per-user limit.
    sleep(0.55);
}
