/**
 * scripts/build-iata-city.js
 *
 * Zero-dependency builder that reads OurAirports airports.csv
 * and produces a lightweight IATA → City mapping JSON for the app.
 *
 * Output: public/data/iata-city.json
 *
 * CSV 입력 우선순위:
 *   1) 환경변수 CSV_PATH 로 지정된 로컬 파일 (GitHub Actions에서 curl로 받음)
 *   2) (백업) 네트워크 fetch(가능할 때만). CI에서는 권장 X
 *
 * Node v18+ (global fetch) 이상 권장.
 */

const fs = require("node:fs");
const path = require("node:path");

const OUT_PATH = path.join(process.cwd(), "public", "data", "iata-city.json");
const SRC_URL = "https://ourairports.com/data/airports.csv";

// ---- Manual preferred-city overrides for airports whose municipality ≠ market city ----
const CITY_OVERRIDES = {
  // KR / JP
  ICN: "Seoul", GMP: "Seoul", CJU: "Jeju", PUS: "Busan",
  NRT: "Tokyo", HND: "Tokyo", NGO: "Nagoya", KIX: "Osaka", ITM: "Osaka",
  CTS: "Sapporo", FUK: "Fukuoka", OKA: "Naha", SDJ: "Sendai",
  // TW / HK / SG
  TPE: "Taipei", TSA: "Taipei", KHH: "Kaohsiung", HKG: "Hong Kong", SIN: "Singapore",
  // TH
  BKK: "Bangkok", DMK: "Bangkok", CNX: "Chiang Mai", HKT: "Phuket",
  // CN (selected)
  PVG: "Shanghai", SHA: "Shanghai", PEK: "Beijing", PKX: "Beijing",
  CAN: "Guangzhou", SZX: "Shenzhen",
  // US/CA/EU hubs
  LAX: "Los Angeles", SFO: "San Francisco",
  JFK: "New York", EWR: "New York", LGA: "New York",
  IAD: "Washington", DCA: "Washington", ORD: "Chicago", SEA: "Seattle",
  YVR: "Vancouver", YYZ: "Toronto",
  LHR: "London", LGW: "London", LCY: "London", STN: "London",
  CDG: "Paris", ORY: "Paris",
  BCN: "Barcelona", MAD: "Madrid", FCO: "Rome", MXP: "Milan",
  AMS: "Amsterdam", FRA: "Frankfurt", MUC: "Munich", ZRH: "Zurich",
  VIE: "Vienna", IST: "Istanbul",
};

// ---- Tiny CSV parser (handles quotes & escaped quotes) ----
function parseCSV(text) {
  const rows = [];
  let i = 0, field = "", row = [], inQuotes = false;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; }
        else { inQuotes = false; i++; }
      } else { field += c; i++; }
      continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); field = ""; row = []; i++; continue; }
    if (c === "\r") { if (text[i + 1] === "\n") i++; row.push(field); rows.push(row); field = ""; row = []; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const header = rows[0].map(h => h.trim());
  const objs = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0] === "") continue;
    const o = {};
    for (let c = 0; c < header.length; c++) o[header[c]] = row[c] ?? "";
    objs.push(o);
  }
  return objs;
}

// ---- Helpers ----
const toNum = v => (Number.isFinite(Number(v)) ? Number(v) : undefined);

function guessCityFromAirportName(name) {
  if (!name) return undefined;
  let s = name
    .replace(/\bInternational\b/gi, "")
    .replace(/\bIntl\.?\b/gi, "")
    .replace(/\bAirport\b/gi, "")
    .replace(/\bAeropuerto\b/gi, "")
    .replace(/\bAéroport\b/gi, "")
    .replace(/\bFlughafen\b/gi, "")
    .replace(/\bAeroporto\b/gi, "")
    .replace(/\s*\(.*?\)\s*$/, "")
    .trim();
  if (s.includes("-") || s.includes("–")) s = s.split(/[-–]/)[0].trim();
  const first = s.split(/\s+/)[0];
  if (/^[A-Z][a-zA-Z'’.-]+$/.test(first)) return first;
  return s || undefined;
}

function choosePreferredCity(iata, municipality, airportName) {
  const upper = String(iata || "").toUpperCase();
  if (CITY_OVERRIDES[upper]) return CITY_OVERRIDES[upper];
  if (municipality && municipality.trim()) return municipality.trim();
  return guessCityFromAirportName(airportName) || municipality || airportName || upper;
}

// ---- Load CSV: prefer local file via CSV_PATH, else fetch (best effort) ----
async function loadCSV() {
  const csvPath = process.env.CSV_PATH;
  if (csvPath && fs.existsSync(csvPath)) {
    console.log("✓ Using local CSV:", csvPath);
    return fs.readFileSync(csvPath, "utf8");
  }
  console.log("↓ Downloading CSV via fetch:", SRC_URL);
  const res = await fetch(SRC_URL, { redirect: "follow" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return await res.text();
}

// ---- Main ----
async function main() {
  const csv = await loadCSV();
  console.log("✓ CSV size:", (csv.length / 1024).toFixed(1), "KB");

  const objs = rowsToObjects(parseCSV(csv));

  let total = 0, used = 0;
  const out = {};

  for (const a of objs) {
    total++;
    const iata = (a.iata_code || "").trim();
    if (!iata) continue;
    const type = (a.type || "").toLowerCase();
    if (!type.includes("airport")) continue;

    const key = iata.toLowerCase();
    const airport = (a.name || "").trim();
    const municipality = (a.municipality || "").trim();
    const country = (a.iso_country || "").trim().toUpperCase();
    const lat = toNum(a.latitude_deg);
    const lon = toNum(a.longitude_deg);

    const city = choosePreferredCity(iata, municipality, airport);

    out[key] = {
      city,
      municipality: municipality || undefined,
      airport: airport || undefined,
      country: country || undefined,
      lat,
      lon,
      source: "ourairports",
    };
    used++;
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");

  console.log(`✓ Built ${OUT_PATH}`);
  console.log(`  Parsed rows: ${total}`);
  console.log(`  IATA mapped: ${used}`);
  console.log(`  Example NGO:`, out["ngo"]);
}

if (require.main === module) {
  main().catch(err => { console.error("✗ Build failed:", err); process.exit(1); });
}
