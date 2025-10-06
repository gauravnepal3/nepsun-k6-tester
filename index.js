import http from 'k6/http';
import { sleep } from 'k6';

// -------- Master Lists (as provided) -------- //
const countries = ["AF", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CD", "CG", "CK", "CR", "HR", "CU", "CW", "CY", "CZ", "CI", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "MK", "RO", "RU", "RW", "RE", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS", "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "UM", "US", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW", "AX"];
const languages = ["en-US", "en-GB", "fr-FR", "de-DE", "es-ES", "hi-IN", "zh-CN", "ja-JP", "ko-KR", "pt-BR"];
const devices = ["Laptop", "Desktop", "Mobile", "TV"];
const oses = ["Windows", "Mac", "Linux", "Android", "iOS"];
const browsers = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];
const iabs = [
    "IAB1", "IAB1-1", "IAB1-2", "IAB1-3", "IAB1-4", "IAB1-5", "IAB1-6", "IAB1-7",
    "IAB2", "IAB2-1", "IAB2-2", "IAB2-3", "IAB2-4", "IAB2-5", "IAB2-6", "IAB2-7", "IAB2-8", "IAB2-9", "IAB2-10", "IAB2-11", "IAB2-12", "IAB2-13", "IAB2-14", "IAB2-15", "IAB2-16", "IAB2-17", "IAB2-18", "IAB2-19", "IAB2-20", "IAB2-21", "IAB2-22", "IAB2-23",
    "IAB3", "IAB3-1", "IAB3-2", "IAB3-3", "IAB3-4", "IAB3-5", "IAB3-6", "IAB3-7", "IAB3-8", "IAB3-9", "IAB3-10", "IAB3-11", "IAB3-12",
    "IAB4", "IAB4-1", "IAB4-2", "IAB4-3", "IAB4-4", "IAB4-5", "IAB4-6", "IAB4-7", "IAB4-8", "IAB4-9", "IAB4-10", "IAB4-11",
    "IAB5", "IAB5-1", "IAB5-2", "IAB5-3", "IAB5-4", "IAB5-5", "IAB5-6", "IAB5-7", "IAB5-8", "IAB5-9", "IAB5-10", "IAB5-11", "IAB5-12", "IAB5-13", "IAB5-14", "IAB5-15",
    "IAB6", "IAB6-1", "IAB6-2", "IAB6-3", "IAB6-4", "IAB6-5", "IAB6-6", "IAB6-7", "IAB6-8", "IAB6-9",
    "IAB7", "IAB7-1", "IAB7-2", "IAB7-3", "IAB7-4", "IAB7-5", "IAB7-6", "IAB7-7", "IAB7-8", "IAB7-9", "IAB7-10", "IAB7-11", "IAB7-12", "IAB7-13", "IAB7-14", "IAB7-15", "IAB7-16", "IAB7-17", "IAB7-18", "IAB7-19", "IAB7-20", "IAB7-21", "IAB7-22", "IAB7-23", "IAB7-24", "IAB7-25", "IAB7-26", "IAB7-27", "IAB7-28", "IAB7-29", "IAB7-30", "IAB7-31", "IAB7-32", "IAB7-33", "IAB7-34", "IAB7-35", "IAB7-36", "IAB7-37", "IAB7-38", "IAB7-39", "IAB7-40", "IAB7-41", "IAB7-42", "IAB7-43", "IAB7-44", "IAB7-45",
    "IAB8", "IAB8-1", "IAB8-2", "IAB8-3", "IAB8-4", "IAB8-5", "IAB8-6", "IAB8-7", "IAB8-8", "IAB8-9", "IAB8-10", "IAB8-11", "IAB8-12", "IAB8-13", "IAB8-14", "IAB8-15", "IAB8-16", "IAB8-17", "IAB8-18",
    "IAB9", "IAB9-1", "IAB9-2", "IAB9-3", "IAB9-4", "IAB9-5", "IAB9-6", "IAB9-7", "IAB9-8", "IAB9-9", "IAB9-10", "IAB9-11", "IAB9-12", "IAB9-13", "IAB9-14", "IAB9-15", "IAB9-16", "IAB9-17", "IAB9-18", "IAB9-19", "IAB9-20", "IAB9-21", "IAB9-22", "IAB9-23", "IAB9-24", "IAB9-25", "IAB9-26", "IAB9-27", "IAB9-28", "IAB9-29", "IAB9-30", "IAB9-31",
    "IAB10", "IAB10-1", "IAB10-2", "IAB10-3", "IAB10-4", "IAB10-5", "IAB10-6", "IAB10-7", "IAB10-8", "IAB10-9",
    "IAB11", "IAB11-1", "IAB11-2", "IAB11-3", "IAB11-4", "IAB11-5",
    "IAB12", "IAB12-1", "IAB12-2", "IAB12-3",
    "IAB13", "IAB13-1", "IAB13-2", "IAB13-3", "IAB13-4", "IAB13-5", "IAB13-6", "IAB13-7", "IAB13-8", "IAB13-9", "IAB13-10", "IAB13-11", "IAB13-12",
    "IAB14", "IAB14-1", "IAB14-2", "IAB14-3", "IAB14-4", "IAB14-5", "IAB14-6", "IAB14-7", "IAB14-8",
    "IAB15", "IAB15-1", "IAB15-2", "IAB15-3", "IAB15-4", "IAB15-5", "IAB15-6", "IAB15-7", "IAB15-8", "IAB15-9", "IAB15-10",
    "IAB16", "IAB16-1", "IAB16-2", "IAB16-3", "IAB16-4", "IAB16-5", "IAB16-6", "IAB16-7",
    "IAB17", "IAB17-1", "IAB17-2", "IAB17-3", "IAB17-4", "IAB17-5", "IAB17-6", "IAB17-7", "IAB17-8", "IAB17-9", "IAB17-10", "IAB17-11", "IAB17-12", "IAB17-13", "IAB17-14", "IAB17-15", "IAB17-16", "IAB17-17", "IAB17-18", "IAB17-19", "IAB17-20", "IAB17-21", "IAB17-22", "IAB17-23", "IAB17-24", "IAB17-25", "IAB17-26", "IAB17-27", "IAB17-28", "IAB17-29", "IAB17-30", "IAB17-31", "IAB17-32", "IAB17-33", "IAB17-34", "IAB17-35", "IAB17-36", "IAB17-37", "IAB17-38", "IAB17-39", "IAB17-40", "IAB17-41", "IAB17-42", "IAB17-43", "IAB17-44", "IAB17-45",
    "IAB18", "IAB18-1", "IAB18-2", "IAB18-3", "IAB18-4", "IAB18-5", "IAB18-6",
    "IAB19", "IAB19-1", "IAB19-2", "IAB19-3", "IAB19-4", "IAB19-5", "IAB19-6", "IAB19-7", "IAB19-8", "IAB19-9", "IAB19-10", "IAB19-11", "IAB19-12", "IAB19-13", "IAB19-14", "IAB19-15", "IAB19-16", "IAB19-17", "IAB19-18", "IAB19-19", "IAB19-20", "IAB19-21", "IAB19-22", "IAB19-23", "IAB19-24", "IAB19-25", "IAB19-26", "IAB19-27", "IAB19-28", "IAB19-29", "IAB19-30", "IAB19-31", "IAB19-32", "IAB19-33", "IAB19-34", "IAB19-35", "IAB19-36",
    "IAB20", "IAB20-1", "IAB20-2", "IAB20-3", "IAB20-4", "IAB20-5", "IAB20-6", "IAB20-7", "IAB20-8", "IAB20-9", "IAB20-10", "IAB20-11", "IAB20-12", "IAB20-13", "IAB20-14", "IAB20-15", "IAB20-16", "IAB20-17", "IAB20-18", "IAB20-19", "IAB20-20", "IAB20-21", "IAB20-22", "IAB20-23", "IAB20-24", "IAB20-25", "IAB20-26", "IAB20-27",
    "IAB21", "IAB21-1", "IAB21-2", "IAB21-3",
    "IAB22", "IAB22-1", "IAB22-2", "IAB22-3", "IAB22-4",
    "IAB23", "IAB23-1", "IAB23-2", "IAB23-3", "IAB23-4", "IAB23-5", "IAB23-6", "IAB23-7", "IAB23-8", "IAB23-9", "IAB23-10",
    "IAB24",
    "IAB25", "IAB25-1", "IAB25-2", "IAB25-3", "IAB25-4", "IAB25-5", "IAB25-6", "IAB25-7",
    "IAB26", "IAB26-1", "IAB26-2", "IAB26-3", "IAB26-4"
];
const domains = ["gmail.com", "youtube.com", "facebook.com", "twitter.com", "x.com", "linkedin.com"];
const ips = ["10.0.0.1", "10.0.0.2", "192.168.0.101", "203.0.113.1", "8.8.8.8"];

// -------- Helpers -------- //
function pick1(arr) {
    return arr[(Math.random() * arr.length) | 0];
}

// -------- K6 options -------- //
export const options = {
    scenarios: {
        hey_style: {
            executor: 'shared-iterations',
            vus: 10000,             // like -c 10000 (concurrent users)
            iterations: 320000,     // total requests (10000 * 32)
            maxDuration: '10m',     // safety cap (adjust as you like)
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],      // <1% errors allowed
        http_req_duration: ['p(95)<1000'],   // 95% under 1s
    },
};

// Endpoint
const BASE = 'http://45.79.134.126:8080/api/v1/serveByParams';

// Browser -> realistic UA
const UA = {
    Chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
    Firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
    Safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15',
    Edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
    Opera: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36 OPR/110.0.0.0',
};

// Build one-request params (exactly one value each)
function buildParams() {
    const country = pick1(countries);
    const language = pick1(languages);
    const device = pick1(devices);
    const os = pick1(oses);
    const browser = pick1(browsers);
    const iab = pick1(iabs);
    const domain = pick1(domains);
    const ip = pick1(ips);

    const query =
        `country=${encodeURIComponent(country)}` +
        `&language=${encodeURIComponent(language)}` +
        `&device=${encodeURIComponent(device)}` +
        `&os=${encodeURIComponent(os)}` +
        `&browser=${encodeURIComponent(browser)}` +
        `&iab=${encodeURIComponent(iab)}` +
        `&domain=${encodeURIComponent(domain)}` +
        `&ip=${encodeURIComponent(ip)}`;

    const headers = {
        'X-Country': country,
        'Accept-Language': language,
        'User-Agent': UA[browser] || UA.Chrome,
    };

    return { query, headers, tags: { country, language, device, os, browser, iab } };
}

export default function () {
    const { query, headers, tags } = buildParams();
    http.get(`${BASE}?${query}`, { headers, tags });
    sleep(0.001);
}