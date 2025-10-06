// save as load_strict.js
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// ---------------- Options ----------------
export const options = {
    discardResponseBodies: true,
    scenarios: {
        constant_qps: {
            executor: 'constant-arrival-rate',
            rate: Number(__ENV.RATE || 200),           // RPS
            timeUnit: '1s',
            duration: __ENV.DURATION || '60s',
            preAllocatedVUs: Number(__ENV.VUS || 100),
            maxVUs: Number(__ENV.MAX_VUS || 2000),
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<200'],
    },
};

// ---------------- Target ----------------
const SSP_ID = __ENV.SSP_ID || 'dev-ssp-key-123';
const BASE = __ENV.BASE_URL || 'http://localhost:8080';
const URL = `${BASE}/rtb/${SSP_ID}/bid`;

// Optional toggles (off by default to keep payload EXACT)
const RANDOMIZE_IDS = String(__ENV.RANDOMIZE_IDS || 'false') === 'true';
const RANDOMIZE_IP = String(__ENV.RANDOMIZE_IP || 'false') === 'true';

// ---------------- Metrics ----------------
const sent = new Counter('requests_sent');
const ok2xx = new Counter('responses_2xx_or_204');
const lat = new Trend('bidder_latency_ms');

// ---------------- Helpers ----------------
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0, v = (c === 'x') ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomIPv4() { return `${randInt(1, 223)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`; }
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

// ---------------- EXACT template ----------------
const TEMPLATE = {
    "id": "9d554579-f21a-4f6f-a33e-42c41b09b206",
    "imp": [
        {
            "id": "1",
            "banner": {
                "api": [3, 5, 7],
                "w": 300,
                "h": 250,
                "format": [{ "w": 300, "h": 250 }, { "w": 300, "h": 50 }],
                "pos": 1,
                "topframe": 1,
                "battr": [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                "btype": [4],
                "ext": { "placementtype": "banner", "playableonly": false }
            },
            "instl": 0,
            "tagid": "Default",
            "displaymanager": "Chartboost-iOS-SDK",
            "displaymanagerver": "9.4.1",
            "bidfloor": 1,
            "bidfloorcur": "USD",
            "secure": 1,
            "clickbrowser": 1,
            "ext": {
                "skadn": {
                    "versions": ["2.0", "2.2", "3.0", "4.0"],
                    "sourceapp": "1499118002",
                    "skadnetids": ["somedspid.skadnetwork"]
                }
            }
        }
    ],
    "app": {
        "id": "4fa7c657f77659a92b000111",
        "name": "Buster's Boost",
        "bundle": "907175713",
        "storeurl": "https://itunes.apple.com/us/app/busters-boost/id907175713",
        "cat": ["IAB9-30", "IAB10"],
        "publisher": {
            "id": "4dd5173cbb93162407001111",
            "name": "Chartboost Sample Company"
        },
        "ver": "1.0",
        "ext": { "package": "com.chartboost.bustersboost" }
    },
    // site intentionally omitted per your example
    "device": {
        "carrier": "WIFI",
        "connectiontype": 2,
        "devicetype": 1,
        "geo": {
            "city": "San Francisco",
            "country": "USA",
            "ipservice": 2,
            "region": "CA",
            "type": 2,
            "zip": "94105"
        },
        "h": 2008,
        "w": 1536,
        "ifa": "EEEE44E2-EC2C-C266-4A64-AD1CADA1D062",
        "ip": "66.249.79.226",
        "language": "en",
        "lmt": 0,
        "make": "Apple",
        "model": "iPad4,4",
        "os": "dap",
        "osv": "145.1",
        "ua": "Mozilla/5.0 (iPad; CPU OS 10_0_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Mobile/14A403",
        "ext": { "ifv": "AAAA44E3-FC2C-D266-4A64-BD1CADA1D095", "atts": 3 }
    },
    "user": {
        "id": "20470538-b75f-11e6-a614-6158f10b9151",
        "geo": {
            "country": "USA",
            "type": 2,
            "ipservice": 2,
            "region": "CA",
            "city": "San Francisco",
            "zip": "94105"
        },
        "consent": "CQGlhQAQGlhQAAFABBPTBLFsAP_gAAAAAB6YCmwAgCDAFNAAAAAA.YAAAAAAAAAAA",
        "ext": { "consent": 1 }
    },
    "at": 1,
    "cur": ["EUR"],
    "regs": { "coppa": 0, "ext": { "gdpr": 0 } },
    "badv": ["badapps.com", "worseapps.com"],
    "bapp": ["com.badapp", "com.worseapp"],
    "bcat": ["IAB2-3"],
    "tmax": 380,
    "source": {
        "schain": {
            "ver": "1.0",
            "complete": 1,
            "nodes": [{
                "asi": "chartboost.com",
                "sid": "4dd5173cbb93162407001111",
                "rid": "9d554579-f21a-4f6f-a33e-42c41b09b206",
                "hp": 1
            }]
        },
        "ext": { "omidpn": "Chartboost", "omidpv": "9.4.1", "header_bidding": "1" }
    }
};

// ---------------- Request builder ----------------
function makeBody() {
    const obj = deepClone(TEMPLATE);

    if (RANDOMIZE_IDS) {
        const newId = uuid();
        obj.id = newId;
        if (obj?.source?.schain?.nodes?.[0]) {
            obj.source.schain.nodes[0].rid = newId;
        }
    }
    if (RANDOMIZE_IP) {
        const ip = randomIPv4();
        obj.device.ip = ip;
    }
    return obj;
}

// ---------------- VU ----------------
export default function () {
    const payload = makeBody();

    // Ensure headers carry same UA and IP as body
    const ua = payload.device.ua;
    const ipHdr = payload.device.ip;

    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': ua,
        'x-forwarded-for': ipHdr,
    };

    sent.add(1);
    const res = http.post(URL, JSON.stringify(payload), { headers, timeout: '1s', tags: { ssp: SSP_ID } });
    lat.add(res.timings.duration, { ssp: SSP_ID });

    const ok = (res.status >= 200 && res.status < 300) || res.status === 204;
    check(res, { 'ok (2xx or 204)': () => ok }) && ok2xx.add(1);
}

// ---------------- Summary ----------------
export function handleSummary(data) {
    const durStr = String(options.scenarios.constant_qps.duration || '60s');
    const durationSec = Number(durStr.replace('s', '')) || 60;
    const total = data.metrics.http_reqs?.values?.count || 0;
    const qps = (total / durationSec).toFixed(2);

    const txt =
        `\n==== k6 Summary ====\n` +
        `Target URL: ${URL}\n` +
        `Sent: ${total} requests in ${durationSec}s\n` +
        `Approx QPS: ${qps}\n` +
        `2xx/204: ${data.metrics['responses_2xx_or_204']?.values?.count || 0}\n` +
        `p95: ${data.metrics.http_req_duration.values['p(95)']} ms\n` +
        `====================\n`;
    return { stdout: txt };
}