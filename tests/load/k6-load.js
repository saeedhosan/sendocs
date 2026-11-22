import * as landing from './workloads/landing.js';
import * as auth from './workloads/auth.js';
import * as owner from './workloads/owner.js';
import * as client from './workloads/client.js';

export { handleSummary } from './helpers/summary.js';

const WORKLOADS = { landing, auth, owner, client };
const workload = WORKLOADS[__ENV.WORKLOAD_GROUP || 'landing'];

function groupThresholds() {
    const thresholds = { workload_http_failed: ['rate<0.01'] };
    const names = {
        landing: ['landing_success'],
        auth: ['auth_login_success', 'auth_session_success'],
        owner: ['owner_list_success', 'owner_detail_success'],
        client: ['client_upload_success', 'client_portal_success'],
    };
    names[__ENV.WORKLOAD_GROUP || 'landing'].forEach((name) => {
        thresholds[name] = ['rate>0.99'];
    });
    return thresholds;
}

export const options = {
    setupTimeout: '30m',
    scenarios: {
        workload: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 500 },
                { duration: '2m', target: 1000 },
                { duration: '2m', target: 1500 },
                { duration: '1m', target: 1500 },
            ],
            gracefulRampDown: '30s',
            gracefulStop: '30s',
        },
    },
    thresholds: groupThresholds(),
};

export function setup() {
    return workload.setup();
}

export default function (data) {
    workload.default(data);
}
