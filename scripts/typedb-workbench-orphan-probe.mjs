/**
 * Session-local connectivity: graph-entities included in a research-session but with no
 * graph-relationship in that session (workbench viz would show them as isolates).
 * Loads product/.env.local. TypeDB 3 TypeQL (reduce).
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

const driver = new TypeDBHttpDriver({
  username: cfg.username,
  password: cfg.password,
  addresses: cfg.addresses,
});

/** Entities in session with no incident graph-relationship for that session */
const isolatedQuery = `
match
$s isa! research-session, has session-id $sid;
$l isa! session-includes-entity,
  links (container-session: $s, member-entity: $e);
$e isa! graph-entity;
not {
  $r isa graph-relationship,
    links (source-entity: $e, target-entity: $any);
  $r has rel-session-id $rs;
  $rs == $sid;
};
not {
  $r2 isa graph-relationship,
    links (source-entity: $any2, target-entity: $e);
  $r2 has rel-session-id $rs2;
  $rs2 == $sid;
};
reduce $iso = count;
`.trim();

/** graph-entity with no session-includes-entity at all */
const globalOrphanQuery = `
match
$e isa! graph-entity;
not {
  $l isa session-includes-entity,
    links (member-entity: $e);
};
reduce $orph = count;
`.trim();

for (const [label, q] of [
  ["isolated_in_session", isolatedQuery],
  ["graph_entity_without_session_link", globalOrphanQuery],
]) {
  const res = await driver.oneShotQuery(q, false, cfg.database, "read");
  if (isApiErrorResponse(res)) {
    console.log(label, "ERROR", res.err?.message);
    continue;
  }
  const row = res.ok?.answers?.[0]?.data;
  const val =
    row && typeof row === "object"
      ? Object.values(row).find((c) => c?.kind === "value" && typeof c.value === "number")
      : null;
  console.log(label, val?.value ?? JSON.stringify(res.ok).slice(0, 400));
}

const kindDist = `
match
$e isa! graph-entity, has provisional-entity-kind $k;
reduce $c = count groupby $k;
`.trim();
const kd = await driver.oneShotQuery(kindDist, false, cfg.database, "read");
if (isApiErrorResponse(kd)) {
  console.log("provisional_kind_groupby ERROR", kd.err?.message);
} else {
  console.log("provisional_entity_kind_distribution");
  for (const ans of kd.ok?.answers ?? []) {
    const d = ans.data;
    const k = d?.k?.value ?? d?.k;
    const c = Object.values(d).find((x) => x?.kind === "value" && typeof x.value === "number");
    console.log(" ", typeof k === "string" ? k : JSON.stringify(k), "->", c?.value);
  }
}
