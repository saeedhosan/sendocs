import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../config.js';
import { Rate } from 'k6/metrics';

export const landingSuccess = new Rate('landing_success');

export function setup() {
    return { accounts: [] };
}

export default function () {
    const response = http.get(BASE_URL + '/', { tags: { endpoint: 'landing' } });
    landingSuccess.add(check(response, {
        'landing returns HTTP 200': (res) => res.status === 200,
    }));
}
