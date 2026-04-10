/**
 * Quick entity counts per type (TypeDB 3). Loads product/.env.local.
 * Usage: node scripts/typedb-count-by-type.mjs [comma-separated types]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TypeDBHttpDriver, isApiErrorResponse } from "@typedb/driver-http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function applyDotenvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function parseTypeDbConnectionString(cs) {
  const m = cs.match(/typedb:\/\/([^:]+):([^@]+)@https?:\/\/([^?]+)\?name=([^&\s]+)/);
  if (!m) return null;
  const hostPort = m[3].replace(/\/$/, "");
  return {
    username: decodeURIComponent(m[1]),
    password: decodeURIComponent(m[2]),
    address: hostPort,
    database: decodeURIComponent(m[4]),
  };
}

function getTypeDbConfig() {
  const env = process.env;
  const username = env.TYPEDB_USERNAME?.trim();
  const password = env.TYPEDB_PASSWORD?.trim();
  const rawAddress = (env.TYPEDB_ADDRESS ?? env.TYPEDB_HOST)?.trim();
  const database = env.TYPEDB_DATABASE?.trim();
  if (username && password && rawAddress && database) {
    const addr = rawAddress.includes("://") ? rawAddress : `https://${rawAddress}`;
    return { username, password, addresses: [addr], database };
  }
  const cs = env.TYPEDB_CONNECTION_STRING?.trim();
  if (cs) {
    const parsed = parseTypeDbConnectionString(cs);
    if (parsed) {
      const addr = parsed.address.includes("://") ? parsed.address : `https://${parsed.address}`;
      return {
        username: parsed.username,
        password: parsed.password,
        addresses: [addr],
        database: parsed.database,
      };
    }
  }
  return null;
}

applyDotenvFile(path.join(repoRoot, "product", ".env.local"));

const cfg = getTypeDbConfig();
if (!cfg) {
  console.error("Missing TypeDB config");
  process.exit(1);
}

const types =
  process.argv[2]?.split(",").map((s) => s.trim()).filter(Boolean) ??
  [
    "graph-entity",
    "research-session",
    "aura-node-artist",
    "aura-imported-node",
  ];

const driver = new TypeDBHttpDriver({
  username: cfg.username,
  password: cfg.password,
  addresses: cfg.addresses,
});

for (const t of types) {
  const q = `
match $x isa ${t};
count($x);
`.trim();
  const res = await driver.oneShotQuery(q, false, cfg.database, "read");
  if (isApiErrorResponse(res)) {
    console.log(`${t}: error ${res.err?.message}`);
    continue;
  }
  console.log(`${t}:`, JSON.stringify(res.ok).slice(0, 200));
}
