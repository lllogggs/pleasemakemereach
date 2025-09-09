/**
 * scripts/build-iata-city.js
 *
 * Zero-dependency builder that fetches OurAirports airports.csv
 * and produces a lightweight IATA → City mapping JSON for the app.
 *
 * Output: public/data/iata-city.json
 *   {
 *     "ngo": {
 *       "city": "Nagoya",                    // preferred city name (override → municipality → guess)
 *       "municipality": "Tokoname",         // raw municipality from CSV
 *       "airport": "Chubu Centrair International Airport",
 *       "country": "JP",                    // ISO alpha-2
 *       "lat": 34.858398,                   // latitude_deg
 *       "lon": 136.804999,                  // longitude_deg
 *       "source": "ourairports"
 *     },
 *     ...
 *   }
 *
 * How “city” is chosen:
 *   1) CITY_OVERRIDES (manual) if present
 *   2) municipality (from CSV), if available
 *   3) guessed city from airport name by removing “International”, “Airport”, etc.
 *
 * Node v18+ required (uses global fetch).
 */

const fs = require("node:fs");
const path = require("node:path");
const OUT_PATH = path.join(process.cwd(), "public", "data", "iata-city.json");
const SRC_URL = "https://ourairports.com/data/airports.csv";

// ---- Manual preferred-city overrides for airports whose municipality ≠ market city ----
const CITY_OVERRIDES = {
  // KR / JP major metros
  ICN: "Seoul",
  GMP: "Seoul",
  CJU: "Jeju",
  PUS: "Busan",

  NRT: "Tokyo",
  HND: "Tokyo",
  NGO: "Nagoya",
  KIX: "Osaka",
  ITM: "Osaka",
  CTS: "Sapporo",
  FUK: "Fukuoka",
  OKA: "Naha",
  SDJ: "Sendai",

  // TW / HK / SG
  TPE: "Taipei",
  TSA: "Taipei",
  KHH: "Kaohsiung",
  HKG: "Hong Kong",
  SIN: "Singapore",

  // TH
  BKK: "Bangkok",
  DMK: "Bangkok",
  CNX: "Chiang Mai",
  HKT: "Phuket",

  // CN (selected)
  PVG: "Shanghai",
  SHA: "Shanghai",
  PEK: "Beijing",
  PKX: "Beijing",
  CAN: "Guangzhou",
  SZX: "Shenzhen",

  // US/CA/EU big hubs (common marketing names)
  LAX: "Los Angeles",
  SFO: "San Francisco",
  JFK: "New York",
  EWR: "New York",
  LGA: "New York",
  IAD: "Washington",
  DCA: "Washington",
  ORD: "Chicago",
  SEA: "Seattle",
  YVR: "Vancouver",
  YYZ: "Toronto",
  LHR: "London",
  LGW: "London",
  LCY: "London",
  STN: "London",
  CDG: "Paris",
  ORY: "Paris",
  BCN: "Barcelona",
  MAD: "Madrid",
  FCO: "Rome",
  MXP: "Milan",
  AMS: "Amsterdam",
  FRA: "Frankfurt",
  MUC: "Munich",
  ZRH: "Zurich",
  VIE: "Vienna",
  IST: "Istanbul",
};

// ---- Minimal CSV parser (handles quotes & escaped quotes) — no external deps ----
function parseCSV(text) {
  const rows = [];
  let i = 0, field = "", row = [], inQuotes = false;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        // Escaped double quote
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += c;
        i++;
        continue;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (c === ",") {
        row.push(field);
        field = "";
        i++;
        continue;
      }
      if (c === "\n") {
        row.push(field);
        rows.push(row);
        field = "";
        row = [];
        i++;
        continue;
      }
      if (c === "\r") {
        // handle CRLF
        if (text[i + 1] === "\n") {
          i++;
        }
        row.push(field);
        rows.push(row);
        field = "";
        row = [];
        i++;
        continue;
      }
      field += c;
      i++;
    }
  }
  // last field / row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const objs = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0] === "") continue; // trailing blank
    const o = {};
    for (let c = 0; c < header.length; c++) {
      o[header[c]] = row[c] ?? "";
    }
    objs.push(o);
  }
  return objs;
}

// ---- Helpers ----
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function guessCityFromAirportName(name) {
  if (!name) return undefined;
  // Remove common suffixes
  let s = name
    .replace(/\bInternational\b/gi, "")
    .replace(/\bIntl\.?\b/gi, "")
    .replace(/\bAirport\b/gi, "")
    .replace(/\bAeropuerto\b/gi, "")
    .replace(/\bAéroport\b/gi, "")
    .replace(/\bFlughafen\b/gi, "")
    .replace(/\bAeroporto\b/gi, "")
    .replace(/\bAeroport\b/gi, "")
    .replace(/\bAeroporto\b/gi, "")
    .replace(/\bAeroporto di\b/gi, "")
    .replace(/\bAeroporto de\b/gi, "")
    .trim();

  // If it contains parentheses like "City (Something)", prefer before parenthesis
  s = s.replace(/\s*\(.*?\)\s*$/, "").trim();

  // If contains hyphen/– use the first segment (e.g., "Paris-Orly" → "Paris")
  if (s.includes("-") || s.includes("–")) {
    s = s.split(/[-–]/)[0].trim();
  }

  // Lastly, take the last word if string still looks like “[Something] Airport Name”
  // but avoid returning very short fragments
  if (s.split(/\s+/).length >= 2) {
    // Heuristic: if the first token looks like a city (capitalized) use it
    const first = s.split(/\s+/)[0];
    if (/^[A-Z][a-zA-Z'’.-]+$/.test(first)) return first;
  }

  return s || undefined;
}

function choosePreferredCity(iata, municipality, airportName) {
  const upper = iata.toUpperCase();
  if (CITY_OVERRIDES[upper]) return CITY_OVERRIDES[upper];
  if (municipality && municipality.trim()) return municipality.trim();
  const guessed = guessCityFromAirportName(airportName || "");
  return guessed || municipality || airportName || upper;
}

// ---- Main ----
async function main() {
  console.log("↓ Downloading:", SRC_URL);
  const res = await fetch(SRC_URL, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const csv = await res.text();
  console.log("✓ Downloaded CSV:", (csv.length / 1024).toFixed(1), "KB");

  const rows = parseCSV(csv);
  const objs = rowsToObjects(rows);

  // Expected columns: iata_code, name, type, municipality, iso_country, latitude_deg, longitude_deg, ...
  let total = 0;
  let used = 0;
  const out = {};

  for (const a of objs) {
    total++;
    const iata = (a.iata_code || "").trim();
    if (!iata) continue; // skip rows without IATA
    const type = (a.type || "").toLowerCase();
    if (!type.includes("airport")) continue; // skip non-airports just in case

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

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");

  console.log(`✓ Built ${OUT_PATH}`);
  console.log(`  Parsed rows: ${total}`);
  console.log(`  IATA mapped: ${used}`);
  console.log(`  Example NGO:`, out["ngo"]);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("✗ Build failed:", err);
    process.exit(1);
  });
}
