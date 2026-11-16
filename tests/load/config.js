export const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
export const TARGET_VUS = Number(__ENV.TARGET_VUS || 100);
export const WORKLOAD_GROUP = __ENV.WORKLOAD_GROUP || 'landing';
export const RAW_TEST_DURATION = __ENV.TEST_DURATION || '60s';
export const TEST_DURATION = RAW_TEST_DURATION === '0' ? '24h' : RAW_TEST_DURATION;
export const SETUP_TIMEOUT = __ENV.SETUP_TIMEOUT || '20m';
export const PASSWORD = 'Benchmark-pass-123!';

export const GROUPS = ['landing', 'auth', 'owner', 'client'];

if (GROUPS.indexOf(WORKLOAD_GROUP) === -1) {
    throw new Error('WORKLOAD_GROUP must be one of: ' + GROUPS.join(', '));
}
if (!Number.isSafeInteger(TARGET_VUS) || TARGET_VUS < 1) {
    throw new Error('TARGET_VUS must be a positive integer.');
}
