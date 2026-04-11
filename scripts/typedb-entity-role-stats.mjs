/**
 * Read-only: per entity type, count direct instances (isa!) and role-player incidences in relations.
 *
 * Env: same as scripts/dump-typedb-schema.mjs — loads product/.env.local then repo .env.local.
 * Entity types: parsed from docs/DB-Schema-Export.typeql (committed snapshot).
 *
 * Semantics:
 * - Node count: instances with `isa! <type>` (direct type only; excludes instances only typed as subtypes).
 * - Relationship count: for each entity type E, sum over every relation type R and role in R of
 *   `count` of bindings ($r, $p) where $r isa R, $r links (role: $p), $p isa! E (each role slot = one edge).
 *
 * Usage:
 *   node scripts/typedb-entity-role-stats.mjs           # markdown table to stdout
 *   node scripts/typedb-entity-role-stats.mjs --json    # machine-readable
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TypeDBHttpDriver, isApiErrorResponse, isOkResponse } from "@typedb/driver-http";
import {
  parseEntityTypeNames,
  parseRelationTwoRoles,
  parseTypeDbConnectionString,
} from "./lib/typedb-database-copy.mjs";

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

function missingEnvDetail() {
  const hasUser = Boolean(process.env.TYPEDB_USERNAME?.trim());
  const hasPass = Boolean(process.env.TYPEDB_PASSWORD?.trim());
  const hasAddr = Boolean((process.env.TYPEDB_ADDRESS ?? process.env.TYPEDB_HOST)?.trim());
  const hasDb = Boolean(process.env.TYPEDB_DATABASE?.trim());
  const cs = process.env.TYPEDB_CONNECTION_STRING?.trim();
  if (hasUser && hasPass && hasAddr && hasDb) return null;
  if (cs) {
    return "TYPEDB_CONNECTION_STRING is set but could not be parsed (expected typedb://user:pass@https://host:port/?name=database).";
  }
  const parts = [];
  if (!hasUser) parts.push("TYPEDB_USERNAME");
  if (!hasPass) parts.push("TYPEDB_PASSWORD");
  if (!hasAddr) parts.push("TYPEDB_ADDRESS or TYPEDB_HOST");
  if (!hasDb) parts.push("TYPEDB_DATABASE");
  return `Missing: ${parts.join(", ")} (or a valid TYPEDB_CONNECTION_STRING).`;
}

/**
 * @param {import("@typedb/driver-http").QueryResponse} res
 * @returns {number | null}
 */
function extractCount(res) {
  if (res.answerType === "conceptRows" && res.answers?.length) {
    const row = res.answers[0].data;
    for (const c of Object.values(row)) {
      if (c?.kind === "value" && typeof c.value === "number") return c.value;
      if (c?.kind === "value" && c.value != null && !Number.isNaN(Number(c.value))) return Number(c.value);
    }
  }
  return null;
}

applyDotenvFile(path.join(repoRoot, "product", ".env.local"));
applyDotenvFile(path.join(repoRoot, ".env.local"));

const jsonOut = process.argv.includes("--json");
const schemaPath = path.join(repoRoot, "docs", "DB-Schema-Export.typeql");
const schemaText = fs.readFileSync(schemaPath, "utf8");
const entityTypes = parseEntityTypeNames(schemaText).sort();
const relSpecs = parseRelationTwoRoles(schemaText);

const cfg = getTypeDbConfig();
if (!cfg) {
  const detail = missingEnvDetail() ?? "TypeDB configuration incomplete.";
  console.error(detail);
  if (jsonOut) {
    console.log(JSON.stringify({ ok: false, error: detail }, null, 2));
  }
  process.exit(2);
}

const driver = new TypeDBHttpDriver({
  username: cfg.username,
  password: cfg.password,
  addresses: cfg.addresses,
});

const health = await driver.health();
if (isApiErrorResponse(health)) {
  const msg = health.err?.message ?? "health check failed";
  console.error(`TypeDB unreachable: ${msg}`);
  if (jsonOut) {
    console.log(JSON.stringify({ ok: false, error: msg }, null, 2));
  }
  process.exit(1);
}

/** @type {Record<string, { nodes: number, edges: number }>} */
const stats = {};
for (const t of entityTypes) {
  stats[t] = { nodes: 0, edges: 0 };
}

for (const t of entityTypes) {
  const q = `match $x isa! ${t};\ncount($x);`;
  const res = await driver.oneShotQuery(q, false, cfg.database, "read");
  if (isApiErrorResponse(res)) {
    console.error(`count nodes ${t}: ${res.err?.message}`);
    process.exit(1);
  }
  if (!isOkResponse(res)) {
    console.error(`count nodes ${t}: empty response`);
    process.exit(1);
  }
  const n = extractCount(res.ok);
  if (n == null) {
    console.error(`count nodes ${t}: could not parse count from response`);
    process.exit(1);
  }
  stats[t].nodes = n;
}

for (const { name: relType, role1, role2 } of relSpecs) {
  for (const role of [role1, role2]) {
    for (const t of entityTypes) {
      const q = `
match
$r isa! ${relType}, links (${role}: $p);
$p isa! ${t};
count($r);
`.trim();
      const res = await driver.oneShotQuery(q, false, cfg.database, "read");
      if (isApiErrorResponse(res)) {
        console.error(`role count ${relType} ${role} ${t}: ${res.err?.message}`);
        process.exit(1);
      }
      if (!isOkResponse(res)) {
        console.error(`role count ${relType} ${role} ${t}: empty response`);
        process.exit(1);
      }
      const n = extractCount(res.ok);
      if (n == null) {
        console.error(`role count ${relType} ${role} ${t}: could not parse count`);
        process.exit(1);
      }
      stats[t].edges += n;
    }
  }
}

const totalNodes = entityTypes.reduce((s, t) => s + stats[t].nodes, 0);
const totalEdges = entityTypes.reduce((s, t) => s + stats[t].edges, 0);

if (jsonOut) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        database: cfg.database,
        semantics: {
          nodeCount: "direct entity instances only (isa! type); subtyped-only instances excluded from that type's row",
          relationshipCount: "sum of relation instances per (relation type, role) where the player is isa! that entity type; double-counts if same entity plays two roles in one relation",
        },
        entityTypes,
        stats,
        totals: { nodes: totalNodes, relationshipIncidences: totalEdges },
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log("| entity type (label) | node count | relationship count |");
console.log("| --- | ---: | ---: |");
for (const t of entityTypes) {
  console.log(`| ${t} | ${stats[t].nodes} | ${stats[t].edges} |`);
}
console.log("");
console.log(
  `**Totals:** nodes = ${totalNodes}; relationship incidences (role-player edges) = ${totalEdges}`,
);
