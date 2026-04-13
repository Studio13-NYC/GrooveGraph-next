/**
 * Per-database snapshot: schema type counts (entity / relation / attribute labels)
 * and instance counts (`isa!` per type). Uses same env as other TypeDB scripts.
 *
 * Usage:
 *   node scripts/typedb-db-snapshot-counts.mjs
 *     → uses database from TYPEDB_* / TYPEDB_CONNECTION_STRING (?name=)
 *   node scripts/typedb-db-snapshot-counts.mjs groovegraph groovegraph-db
 *     → same credentials, two databases (e.g. legacy vs current)
 *
 * Override DB when using only TYPEDB_CONNECTION_STRING (embedded ?name=):
 *   TYPEDB_TARGET_DATABASE=groovegraph node scripts/typedb-db-snapshot-counts.mjs
 *
 * Second TypeDB Cloud cluster (e.g. legacy **groove-graph** vs **groovegraph-db**):
 *   Cluster name is NOT the logical database name. Each cluster has its own host.
 *
 * Option A — full second line (duplicate secret):
 *   TYPEDB_GROOVE_GRAPH_CONNECTION_STRING=typedb://user:pass@https://HOST/?name=DATABASE
 *
 * Option B — reuse username/password already in .env (same as primary), different host only:
 *   TYPEDB_LEGACY_ADDRESS=https://v7fqs7-0.cluster.typedb.com:80
 *   TYPEDB_LEGACY_DATABASE=groovegraph   (optional; defaults to primary database name)
 *   If the legacy cluster uses a different password, Option A is required.
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

/** @param {string} schemaText */
function parseSchemaTypeLabels(schemaText) {
  const entities = new Set();
  const relations = new Set();
  const attributes = new Set();
  const em = /^entity\s+([a-zA-Z0-9_-]+)/gm;
  const rm = /^relation\s+([a-zA-Z0-9_-]+)/gm;
  const am = /^attribute\s+([a-zA-Z0-9_-]+)/gm;
  let m;
  while ((m = em.exec(schemaText))) entities.add(m[1]);
  while ((m = rm.exec(schemaText))) relations.add(m[1]);
  while ((m = am.exec(schemaText))) attributes.add(m[1]);
  return {
    entities: [...entities].sort(),
    relations: [...relations].sort(),
    attributes: [...attributes].sort(),
  };
}

function reduceCountValue(ok) {
  if (ok?.answerType !== "conceptRows" || !ok.answers?.length) return 0;
  const row = ok.answers[0].data;
  if (!row) return 0;
  for (const c of Object.values(row)) {
    if (c && typeof c === "object" && c.kind === "value" && typeof c.value === "number") {
      return c.value;
    }
  }
  return 0;
}

applyDotenvFile(path.join(repoRoot, "product", ".env.local"));
applyDotenvFile(path.join(repoRoot, ".env.local"));

const cfgBase = getTypeDbConfig();
if (!cfgBase) {
  console.error(
    "Missing TypeDB config. Set TYPEDB_CONNECTION_STRING or TYPEDB_USERNAME, TYPEDB_PASSWORD, TYPEDB_ADDRESS, TYPEDB_DATABASE.",
  );
  process.exit(1);
}

const envTarget = process.env.TYPEDB_TARGET_DATABASE?.trim();
const argvDbs = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const databases =
  argvDbs.length > 0 ? argvDbs : envTarget ? [envTarget] : [cfgBase.database];

/** @param {{ username: string, password: string, addresses: string[], database: string }} cfg */
async function snapshotDatabase(cfg, title) {
  const driver = new TypeDBHttpDriver({
    username: cfg.username,
    password: cfg.password,
    addresses: cfg.addresses,
  });

  const schemaRes = await driver.getDatabaseSchema(cfg.database);
  if (isApiErrorResponse(schemaRes)) {
    return {
      title,
      host: cfg.addresses[0] ?? "",
      database: cfg.database,
      error: schemaRes.err?.message ?? String(schemaRes),
      entities: [],
      relations: [],
      attributes: [],
      entityInstances: [],
      relationInstances: [],
    };
  }
  const schemaText = typeof schemaRes.ok === "string" ? schemaRes.ok : "";
  const { entities, relations, attributes } = parseSchemaTypeLabels(schemaText);

  /** @type {{ type: string, count: number, err?: string }[]} */
  const entityInstances = [];
  /** @type {{ type: string, count: number, err?: string }[]} */
  const relationInstances = [];

  for (const t of entities) {
    const q = `
match $x isa! ${t};
reduce $c = count;
`.trim();
    const raw = await driver.oneShotQuery(q, false, cfg.database, "read");
    if (isApiErrorResponse(raw)) {
      const msg = String(raw.err?.message ?? "");
      if (msg.includes("not found") && msg.includes("Type label")) {
        entityInstances.push({ type: t, count: 0, err: "type not in this database schema" });
      } else {
        entityInstances.push({ type: t, count: 0, err: msg.slice(0, 120) });
      }
      continue;
    }
    entityInstances.push({ type: t, count: reduceCountValue(raw.ok) });
  }

  for (const t of relations) {
    const q = `
match $r isa! ${t};
reduce $c = count;
`.trim();
    const raw = await driver.oneShotQuery(q, false, cfg.database, "read");
    if (isApiErrorResponse(raw)) {
      const msg = String(raw.err?.message ?? "");
      if (msg.includes("not found") && msg.includes("Type label")) {
        relationInstances.push({ type: t, count: 0, err: "type not in this database schema" });
      } else {
        relationInstances.push({ type: t, count: 0, err: msg.slice(0, 120) });
      }
      continue;
    }
    relationInstances.push({ type: t, count: reduceCountValue(raw.ok) });
  }

  const totalEntityInstances = entityInstances.reduce((s, r) => s + r.count, 0);
  const totalRelationInstances = relationInstances.reduce((s, r) => s + r.count, 0);

  return {
    title,
    host: cfg.addresses[0] ?? "",
    database: cfg.database,
    error: null,
    schemaBytes: schemaText.length,
    typeCounts: {
      entityTypes: entities.length,
      relationTypes: relations.length,
      attributeTypes: attributes.length,
    },
    instanceTotals: {
      entityInstances: totalEntityInstances,
      relationInstances: totalRelationInstances,
    },
    entities,
    relations,
    attributes,
    entityInstances,
    relationInstances,
  };
}

function printSnapshot(s) {
  console.log("");
  const where = s.host ? `${s.title} — ${s.host} — database \`${s.database}\`` : `${s.title} — database \`${s.database}\``;
  console.log(`=== ${where} ===`);
  if (s.error) {
    console.log(`ERROR: ${s.error}`);
    return;
  }
  console.log(`Schema text length: ${s.schemaBytes} bytes`);
  console.log(
    `Type counts — entities: ${s.typeCounts.entityTypes}, relations: ${s.typeCounts.relationTypes}, attributes: ${s.typeCounts.attributeTypes}`,
  );
  console.log(
    `Instance totals — entity instances (sum of isa! counts): ${s.instanceTotals.entityInstances}; relation instances: ${s.instanceTotals.relationInstances}`,
  );

  const nonZeroEnt = s.entityInstances.filter((r) => r.count > 0);
  const nonZeroRel = s.relationInstances.filter((r) => r.count > 0);
  console.log(`Non-zero entity types: ${nonZeroEnt.length} / ${s.entityInstances.length}`);
  console.log(`Non-zero relation types: ${nonZeroRel.length} / ${s.relationInstances.length}`);

  console.log("\n-- Entity types with instances > 0 (type → count) --");
  for (const r of nonZeroEnt.sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))) {
    console.log(`${r.type}\t${r.count}`);
  }

  console.log("\n-- Relation types with instances > 0 (type → count) --");
  for (const r of nonZeroRel.sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))) {
    console.log(`${r.type}\t${r.count}`);
  }
}

/** @returns {{ username: string, password: string, addresses: string[], database: string } | null} */
function cfgFromTypedbUrl(cs) {
  const parsed = parseTypeDbConnectionString(cs.trim());
  if (!parsed) return null;
  const addr = parsed.address.includes("://") ? parsed.address : `https://${parsed.address}`;
  return {
    username: parsed.username,
    password: parsed.password,
    addresses: [addr],
    database: parsed.database,
  };
}

const snapshots = [];
for (const db of databases) {
  snapshots.push(
    await snapshotDatabase({ ...cfgBase, database: db }, "Primary env (TYPEDB_* / connection string)"),
  );
}

const legacyCs = process.env.TYPEDB_GROOVE_GRAPH_CONNECTION_STRING?.trim();
const legacyAddr = process.env.TYPEDB_LEGACY_ADDRESS?.trim();
const legacyDb = process.env.TYPEDB_LEGACY_DATABASE?.trim();

if (legacyCs) {
  const legacyCfg = cfgFromTypedbUrl(legacyCs);
  if (!legacyCfg) {
    console.error("\nTYPEDB_GROOVE_GRAPH_CONNECTION_STRING is set but could not parse (expected typedb://user:pass@https://host/?name=database).");
  } else {
    snapshots.push(await snapshotDatabase(legacyCfg, "Legacy cluster (TYPEDB_GROOVE_GRAPH_CONNECTION_STRING)"));
  }
} else if (legacyAddr) {
  const addr = legacyAddr.includes("://") ? legacyAddr : `https://${legacyAddr}`;
  const db = legacyDb || cfgBase.database;
  snapshots.push(
    await snapshotDatabase(
      {
        username: cfgBase.username,
        password: cfgBase.password,
        addresses: [addr],
        database: db,
      },
      "Legacy cluster (TYPEDB_LEGACY_ADDRESS + same username/password as primary)",
    ),
  );
}

for (const s of snapshots) {
  printSnapshot(s);
}

console.log("\nDone.");
