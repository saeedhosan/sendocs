import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../config.js';
import { Rate } from 'k6/metrics';
import { recordWorkloadRequest } from '../helpers/metrics.js';

export const authLoginSuccess = new Rate('auth_login_success');
export const authSessionSuccess = new Rate('auth_session_success');

let authCookie = null;

export default function (accounts) {
    const account = accounts[__VU - 1];
    if (!account) {
        throw new Error('No benchmark account was prepared for VU ' + __VU);
    }

    if (!authCookie) {
        const login = http.post(BASE_URL + '/api/v1/auth/login', JSON.stringify({
            email: account.email,
            password: account.password,
        }), {
            headers: {
                'Content-Type': 'application/json',
                'X-Client-IP': account.clientIp,
            },
            tags: { endpoint: 'auth_login' },
        });
        recordWorkloadRequest(login);
        const loginOk = check(login, {
            'auth login returns HTTP 200': (res) => res.status === 200,
        });
        authLoginSuccess.add(loginOk);
        if (!loginOk) {
            return;
        }
        const loginCookie = login.cookies.sendocs_session && login.cookies.sendocs_session[0];
        if (!loginCookie) {
            authSessionSuccess.add(false);
            return;
        }
        authCookie = 'sendocs_session=' + loginCookie.value;
    }

    const session = http.get(BASE_URL + '/api/v1/auth/session', {
        headers: {
            Cookie: authCookie,
            'X-Client-IP': account.clientIp,
        },
        tags: { endpoint: 'auth_session' },
    });
    recordWorkloadRequest(session);
    authSessionSuccess.add(check(session, {
        'auth session returns HTTP 200': (res) => res.status === 200,
    }));
    // The session route is limited to 120 requests/minute per user.
    sleep(0.55);
}
