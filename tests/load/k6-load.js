import * as landing from './workloads/landing.js';
import * as auth from './workloads/auth.js';
import * as owner from './workloads/owner.js';
import * as client from './workloads/client.js';
import {
    TARGET_VUS,
    TEST_DURATION,
    WORKLOAD_GROUP,
} from './config.js';

export { handleSummary } from './helpers/summary.js';

const WORKLOADS = { landing, auth, owner, client };
const workload = WORKLOADS[WORKLOAD_GROUP];

function groupThresholds() {
    const thresholds = { workload_http_failed: ['rate<0.01'] };
    const names = {
        landing: ['landing_success'],
        auth: ['auth_login_success', 'auth_session_success'],
        owner: ['owner_list_success', 'owner_detail_success'],
        client: ['client_upload_success', 'client_portal_success'],
    };
    names[WORKLOAD_GROUP].forEach((name) => {
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
                { duration: '2m', target: Math.round(TARGET_VUS / 3) },
                { duration: '2m', target: Math.round((TARGET_VUS * 2) / 3) },
                { duration: '2m', target: TARGET_VUS },
                { duration: TEST_DURATION, target: TARGET_VUS },
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
