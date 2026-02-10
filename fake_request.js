import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

/**
 * RTB QPS limit test for /rtb/{SSP_API_KEY}/bid
 *
 * Supports:
 *  - Step/ramp QPS test (recommended) using ramping-arrival-rate
 *  - Constant QPS test using constant-arrival-rate
 *
 * Env vars:
 *  BASE_URL                default: https://delivery.adstork.com
 *  SSP_API_KEY             required
 *
 *  MODE                    "ramp" (default) or "constant"
 *
 *  # Ramp mode:
 *  STAGES                  default: "200:30s,400:30s,600:30s,800:30s,1000:30s"
 *                          format: "rate:duration,rate:duration,..."
 *  START_RATE              default: first stage rate (or 1 if empty)
 *  TIME_UNIT               default: "1s"
 *
 *  # Constant mode:
 *  TARGET_QPS              default: 500
 *  DURATION                default: "60s"
 *
 *  # Load engine:
 *  PRE_ALLOCATED_VUS       default: 300
 *  MAX_VUS                 default: 2000
 *
 *  # Request:
 *  TIMEOUT                 default: "5s"
 *  FIXED_IP                if set, use same IP for all reqs (helpful for per-IP limits)
 *  IP_PREFIX               default: "27.34"  (used when randomizing)
 *
 *  # Thresholds (tune for your infra):
 *  P95_MS                  default: 1000
 *  FAIL_RATE               default: 0.20
 */

const BASE_URL = __ENV.BASE_URL || "https://delivery.adstork.com";
const SSP_API_KEY = __ENV.SSP_API_KEY || "";
const MODE = (__ENV.MODE || "ramp").toLowerCase();

const PRE_ALLOCATED_VUS = __ENV.PRE_ALLOCATED_VUS ? parseInt(__ENV.PRE_ALLOCATED_VUS, 10) : 300;
const MAX_VUS = __ENV.MAX_VUS ? parseInt(__ENV.MAX_VUS, 10) : 2000;

const TIMEOUT = __ENV.TIMEOUT || "5s";
const IP_PREFIX = __ENV.IP_PREFIX || "27.34";
const FIXED_IP = __ENV.FIXED_IP || "";

const P95_MS = __ENV.P95_MS ? parseInt(__ENV.P95_MS, 10) : 1000;
const FAIL_RATE = __ENV.FAIL_RATE || "0.20";

// ---------- Metrics ----------
const status200 = new Counter("status_200");
const status204 = new Counter("status_204");
const status429 = new Counter("status_429");
const status5xx = new Counter("status_5xx");
const statusOther = new Counter("status_other");

// ---------- Helpers ----------
function parseStages(stagesStr) {
    // "200:30s,400:30s,600:30s"
    return stagesStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((item) => {
            const [rateStr, duration] = item.split(":").map((x) => x.trim());
            const rate = parseInt(rateStr, 10);
            if (!rate || !duration) throw new Error(`Invalid STAGES item: "${item}"`);
            return { target: rate, duration };
        });
}

function randomIp() {
    if (FIXED_IP) return FIXED_IP;
    const c = Math.floor(Math.random() * 256);
    const d = Math.floor(Math.random() * 256);
    return `${IP_PREFIX}.${c}.${d}`;
}

function idLike() {
    // good enough uniqueness for load testing
    return `${__VU}-${__ITER}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function buildPayload() {
    const reqId = `req-${idLike()}`;
    const impId = `imp-${idLike()}`;
    const ip = randomIp();

    return {
        id: reqId,
        imp: [
            {
                id: impId,
                banner: { w: 300, h: 250 },
                bidfloor: 0.1,
                bidfloorcur: "USD",
                secure: 1,
            },
        ],
        device: {
            ip,
            ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            devicetype: 1,
        },
        site: {
            domain: "example.com",
            page: "https://example.com/article",
            publisher: { id: "pub-1" },
            cat: ["IAB1"],
        },
        tmax: 120,
        at: 2,
    };
}

// ---------- Scenario selection ----------
function scenarioOptions() {
    if (!SSP_API_KEY) {
        throw new Error("Missing SSP_API_KEY. Set -e SSP_API_KEY=...");
    }

    if (MODE === "constant") {
        const TARGET_QPS = __ENV.TARGET_QPS ? parseInt(__ENV.TARGET_QPS, 10) : 500;
        const DURATION = __ENV.DURATION || "60s";
        return {
            scenarios: {
                rtb_constant_rate: {
                    executor: "constant-arrival-rate",
                    rate: TARGET_QPS,
                    timeUnit: "1s",
                    duration: DURATION,
                    preAllocatedVUs: PRE_ALLOCATED_VUS,
                    maxVUs: MAX_VUS,
                },
            },
        };
    }

    // Default: ramp/step test
    const STAGES_STR = __ENV.STAGES || "200:30s,400:30s,600:30s,800:30s,1000:30s";
    const TIME_UNIT = __ENV.TIME_UNIT || "1s";
    const stages = parseStages(STAGES_STR);

    const START_RATE = __ENV.START_RATE ? parseInt(__ENV.START_RATE, 10) : Math.max(1, stages[0]?.target || 1);

    return {
        scenarios: {
            rtb_ramp_rate: {
                executor: "ramping-arrival-rate",
                startRate: START_RATE,
                timeUnit: TIME_UNIT,
                stages,
                preAllocatedVUs: PRE_ALLOCATED_VUS,
                maxVUs: MAX_VUS,
            },
        },
    };
}

export const options = {
    ...scenarioOptions(),
    thresholds: {
        http_req_failed: [`rate<${FAIL_RATE}`],
        http_req_duration: [`p(95)<${P95_MS}`],
    },
};

// ---------- Main ----------
export default function () {
    const url = `${BASE_URL}/rtb/${SSP_API_KEY}/bid`;
    const payload = buildPayload();

    const params = {
        headers: {
            "Content-Type": "application/json",
            "X-Openrtb-Version": "2.5",
            // IMPORTANT: many rate limiters use this header, not device.ip
            "X-Forwarded-For": payload.device.ip,
        },
        timeout: TIMEOUT,
    };

    const res = http.post(url, JSON.stringify(payload), params);

    // Count statuses (helps identify the QPS limit point)
    if (res.status === 200) status200.add(1);
    else if (res.status === 204) status204.add(1);
    else if (res.status === 429) status429.add(1);
    else if (res.status >= 500) status5xx.add(1);
    else statusOther.add(1);

    check(res, {
        "status is 200/204 (ok) OR 429 (rate limited)": (r) =>
            r.status === 200 || r.status === 204 || r.status === 429,
    });

    // tiny sleep prevents extremely tight loops for any fallback executors
    sleep(0.001);
}

// ---------- Summary (prints clear limiter signals) ----------
export function handleSummary(data) {
    const m = data.metrics || {};

    const pick = (name) => (m[name] && m[name].values ? m[name].values.count || 0 : 0);

    const s200 = pick("status_200");
    const s204 = pick("status_204");
    const s429 = pick("status_429");
    const s5xx = pick("status_5xx");
    const sOther = pick("status_other");

    const total = s200 + s204 + s429 + s5xx + sOther;

    const p = (x) => (total > 0 ? ((x / total) * 100).toFixed(2) : "0.00");

    const lines = [];
    lines.push("========== RTB QPS LIMIT TEST SUMMARY ==========");
    lines.push(`Total responses: ${total}`);
    lines.push(`200:  ${s200}  (${p(s200)}%)`);
    lines.push(`204:  ${s204}  (${p(s204)}%)`);
    lines.push(`429:  ${s429}  (${p(s429)}%)  <-- rate limiting signal`);
    lines.push(`5xx:  ${s5xx}  (${p(s5xx)}%)  <-- backend saturation signal`);
    lines.push(`Other:${sOther} (${p(sOther)}%)`);
    lines.push("");
    lines.push("Tip: The QPS limit point is where 429% starts rising sharply while 5xx stays low.");
    lines.push("If 5xx rises first, you hit capacity (CPU/DB/Kafka/etc), not the rate limiter.");
    lines.push("===============================================");

    return {
        stdout: lines.join("\n") + "\n",
        "summary.json": JSON.stringify(data, null, 2),
    };
}