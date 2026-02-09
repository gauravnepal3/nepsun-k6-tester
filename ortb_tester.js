import http from 'k6/http';
import { check } from 'k6';

// --- CONFIGURE YOUR TEST HERE ---

// Target constant arrival rate (QPS):
// e.g. 5000 means "try to start 5000 iterations per second"
const TARGET_QPS = __ENV.TARGET_QPS
    ? parseInt(__ENV.TARGET_QPS, 10)
    : 1000;

// Base URL & API key for your SSP endpoint
const BASE_URL = __ENV.BASE_URL || 'https://delivery.adstork.com';
const SSP_API_KEY = __ENV.SSP_API_KEY || 'your-ssp-api-key-here';

// Duration of the test
const DURATION = __ENV.DURATION || '60s';

// How many VUs k6 can spin up to maintain the target rate
const PRE_ALLOCATED_VUS = __ENV.PRE_ALLOCATED_VUS
    ? parseInt(__ENV.PRE_ALLOCATED_VUS, 10)
    : 300;
const MAX_VUS = __ENV.MAX_VUS
    ? parseInt(__ENV.MAX_VUS, 10)
    : 2000;

// --- K6 OPTIONS ---

export const options = {
    scenarios: {
        rtb_constant_rate: {
            executor: 'constant-arrival-rate',
            rate: TARGET_QPS,      // iterations per timeUnit
            timeUnit: '1s',        // so "rate" is QPS
            duration: DURATION,
            preAllocatedVUs: PRE_ALLOCATED_VUS,
            maxVUs: MAX_VUS,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.05'],     // <5% failures
        http_req_duration: ['p(95)<250'],   // 95% < 250ms (example)
    },
};

// --- UTILS ---

function randomIp() {
    // You can make this more realistic if you want
    const a = 10 + Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 255);
    const c = Math.floor(Math.random() * 255);
    const d = Math.floor(Math.random() * 255);
    return `${a}.${b}.${c}.${d}`;
}

function uuidLike() {
    // good enough for load test IDs
    return (
        Date.now().toString(16) +
        '-' +
        Math.floor(Math.random() * 1e16).toString(16)
    );
}

// --- MAIN VU FUNCTION ---

export default function () {
    const reqId = uuidLike();
    const impId = 'imp-' + uuidLike();

    const payload = {
        id: reqId,
        imp: [
            {
                id: impId,
                banner: {
                    w: 300,
                    h: 250,
            },
                bidfloor: 0.10,         // 10 cents, adjust as you like
                bidfloorcur: 'USD',
                secure: 1,
            },
    ],
        device: {
            ip: randomIp(),
            ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            devicetype: 1, // Desktop
    },
        site: {
            domain: 'example.com',
            page: 'https://example.com/article',
            publisher: { id: 'pub-1' },
            cat: ['IAB1'],
        },
        tmax: 120, // ms; your server will clamp anyway
        at: 2,     // second-price auction (OpenRTB)
    };

    const url = `${BASE_URL}/rtb/${SSP_API_KEY}/bid`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'X-Openrtb-Version': '2.5',
        },
        timeout: '300ms', // client-side timeout
    };

    const res = http.post(url, JSON.stringify(payload), params);

    check(res, {
        'status is 200 or 204': (r) => r.status === 200 || r.status === 204,
    });
}