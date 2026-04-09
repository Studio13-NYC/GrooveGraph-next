/**
 * Read Neo4j Aura (read-only), transform, and write into TypeDB Cloud.
 * Does not delete Neo4j data or TypeDB databases. Only creates the target
 * TypeDB database if it does not exist, applies idempotent schema defines,
 * then inserts nodes and relationships.
 *
 * Prerequisites:
 *   node ontology/scripts/generate-typedb3-schema-lines.mjs
 *
 * Usage (repo root, with product/.env.local or .env.local containing Neo4j + TypeDB):
 *   node ontology/scripts/neo4j-to-typedb-migrate.mjs [--database=name] [--node-batch=80] [--rel-batch=50]
 *   [--limit-nodes=100] [--limit-rels=100]   # smoke test
 *   [--rel-offset=19800] [--rels-only] [--skip-schema]   # resume relationship phase only
 *
 * Re-running the full job on the same database will insert duplicate instances.
 * Use a new TypeDB database name (TypeDB Console) for a clean second load; this script will not drop anything.
 *
 * TypeDB: set TYPEDB_* or connectionString in .env.local (see ontology/scripts/lib/typedb-env.mjs).
 * Neo4j: NEO4J_URI, NEO4J_USERNAME|NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";
import { TypeDBHttpDriver, isApiErrorResponse } from "@typedb/driver-http";
import {
  applyTypeDbEnvFromDotenvText,
  getTypeDbConfig,
  readFirstExistingEnvLocal,
} from "../../../../ontology/scripts/lib/typedb-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Repository root (this file lives under archive/neo4j-branch-only/ontology/scripts/). */
const repoRoot = resolve(__dirname, "../../../..");

function argInt(name, def) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  if (!a) return def;
  return Number.parseInt(a.split("=")[1], 10) || def;
}

function argOptInt(name) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  if (!a) return null;
  const n = Number.parseInt(a.split("=")[1], 10);
  return Number.isFinite(n) ? n : null;
}

const NODE_BATCH = argInt("node-batch", 80);
const REL_BATCH = argInt("rel-batch", 40);
const LIMIT_NODES = argOptInt("limit-nodes");
const LIMIT_RELS = argOptInt("limit-rels");
const REL_OFFSET = argOptInt("rel-offset") ?? 0;
const RELS_ONLY = process.argv.includes("--rels-only");
const SKIP_SCHEMA = process.argv.includes("--skip-schema");

const foundEnv = readFirstExistingEnvLocal(repoRoot);
if (!foundEnv) {
  console.error("Missing product/.env.local or .env.local");
  process.exit(1);
}
const envText = foundEnv.text;
applyTypeDbEnvFromDotenvText(envText);

const typedbCfg = getTypeDbConfig(envText);
if (!typedbCfg) {
  console.error("Missing TypeDB configuration (see ontology/README.md).");
  process.exit(1);
}

const dbOverride = process.argv.find((x) => x.startsWith("--database="))?.split("=")[1]?.trim();
if (dbOverride) typedbCfg.database = dbOverride;

const neo4jUri = process.env.NEO4J_URI?.trim();
const neo4jUser = (process.env.NEO4J_USERNAME ?? process.env.NEO4J_USER)?.trim();
const neo4jPassword = process.env.NEO4J_PASSWORD?.trim();
const neo4jDatabase = process.env.NEO4J_DATABASE?.trim() || "neo4j";

if (!neo4jUri || !neo4jUser || !neo4jPassword) {
  console.error("Missing NEO4J_URI, NEO4J_USERNAME (or NEO4J_USER), or NEO4J_PASSWORD.");
  process.exit(1);
}

const schemaPath = resolve(__dirname, "../sources/typedb3-schema-lines.json");
const { meta, schemaLines } = JSON.parse(readFileSync(schemaPath, "utf8"));

function toKebab(key) {
  let s = String(key);
  if (s.startsWith("__")) s = s.slice(2);
  return s
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

function labelSlug(label) {
  return toKebab(label);
}

function primaryNeo4jLabel(labels) {
  const s = new Set(labels);
  if (s.has("Entity")) return "Entity";
  if (s.has("ResearchSession")) return "ResearchSession";
  const rest = labels.filter((l) => l !== "GraphEntity");
  if (rest.length) return [...rest].sort()[0];
  return labels[0];
}

function escapeTypeqlString(v) {
  return String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function safeNeo4jId(x) {
  if (x == null) return "";
  return String(x);
}

function isTransientWriteError(e) {
  const msg = String(e?.message ?? e).toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("etimedout") ||
    msg.includes("econnreset") ||
    msg.includes("timeout") ||
    msg.includes(" 502") ||
    msg.includes(" 503") ||
    msg.includes(" 504") ||
    msg.includes("socket") ||
    msg.includes("network")
  );
}

function neo4jValueToString(v) {
  if (v === null || v === undefined) return null;
  if (neo4j.isInt(v)) return String(v.toNumber());
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

const typedbDriver = new TypeDBHttpDriver({
  username: typedbCfg.username,
  password: typedbCfg.password,
  addresses: typedbCfg.addresses,
});

async function runSchemaLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("//")) return;
  const res = await typedbDriver.oneShotQuery(trimmed, true, typedbCfg.database, "schema");
  if (isApiErrorResponse(res)) {
    const msg = res.err?.message ?? JSON.stringify(res.err);
    if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("conflict")) {
      return;
    }
    throw new Error(`Schema failed: ${trimmed.slice(0, 120)}\n${msg}`);
  }
}

async function runWriteQuery(q) {
  const res = await typedbDriver.oneShotQuery(q, true, typedbCfg.database, "write", {
    transactionTimeoutMillis: 120_000,
  });
  if (isApiErrorResponse(res)) {
    throw new Error(res.err?.message ?? JSON.stringify(res.err));
  }
}

async function runWriteQueryWithRetry(q, maxAttempts = 5) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await runWriteQuery(q);
      return;
    } catch (e) {
      lastErr = e;
      if (attempt < maxAttempts && isTransientWriteError(e)) {
        const delay = Math.min(30_000, 1000 * 2 ** (attempt - 1));
        console.warn(`TypeDB write retry ${attempt}/${maxAttempts} after ${delay}ms (${String(e?.message ?? e).slice(0, 80)})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

console.log("Source Neo4j (read-only):", meta.neo4jHost, "db", meta.neo4jDatabase);
console.log("Target TypeDB:", typedbCfg.database, typedbCfg.addresses[0]);

{
  const cr = await typedbDriver.createDatabase(typedbCfg.database);
  if (isApiErrorResponse(cr) && !String(cr.err?.message ?? "").toLowerCase().includes("exist")) {
    console.error("createDatabase:", cr.err);
    process.exit(1);
  }
  if (!isApiErrorResponse(cr)) {
    console.log("Created TypeDB database:", typedbCfg.database);
  }
}

if (!SKIP_SCHEMA) {
  console.log("Applying schema lines:", schemaLines.filter((l) => l.trim() && !l.trim().startsWith("//")).length);
  for (const line of schemaLines) {
    await runSchemaLine(line);
  }
  console.log("Schema applied.");
} else {
  console.log("Skipping schema (--skip-schema).");
}

if (LIMIT_NODES == null && LIMIT_RELS == null && !RELS_ONLY) {
  console.log(
    "Note: full load will append data. Re-running without limits duplicates instances. Create a new TypeDB database in Console for a clean import.",
  );
}
if (REL_OFFSET > 0 || RELS_ONLY) {
  console.log(
    `Resume mode: rel-offset=${REL_OFFSET}, rels-only=${RELS_ONLY}. Nodes must already exist in TypeDB with aura-migration-neo4j-element-id.`,
  );
}

const neoDriver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
const neoSession = neoDriver.session({ database: neo4jDatabase });

let exitOk = false;
try {
  if (!RELS_ONLY) {
    const nodeResult = await neoSession.run(
      LIMIT_NODES != null
        ? `
    MATCH (n)
    RETURN elementId(n) AS eid, labels(n) AS labels, properties(n) AS props
    LIMIT $lim
  `
        : `
    MATCH (n)
    RETURN elementId(n) AS eid, labels(n) AS labels, properties(n) AS props
  `,
      LIMIT_NODES != null ? { lim: neo4j.int(LIMIT_NODES) } : {},
    );

    const nodes = nodeResult.records.map((rec) => ({
      eid: rec.get("eid"),
      labels: rec.get("labels"),
      props: rec.get("props"),
    }));

    console.log("Neo4j nodes to import:", nodes.length);

    for (let i = 0; i < nodes.length; i += NODE_BATCH) {
      const chunk = nodes.slice(i, i + NODE_BATCH);
      const parts = [];
      for (let k = 0; k < chunk.length; k++) {
        const { eid, labels, props } = chunk[k];
        const pl = primaryNeo4jLabel(labels);
        const slug = labelSlug(pl);
        const entityType = `aura-node-${slug}`;
        const varName = `$n${k}`;
        const has = [`has aura-migration-neo4j-element-id "${escapeTypeqlString(eid)}"`];
        for (const [key, raw] of Object.entries(props)) {
          const attr = `aura-${slug}-${toKebab(key)}`;
          const s = neo4jValueToString(raw);
          if (s === null) continue;
          has.push(`has ${attr} "${escapeTypeqlString(s)}"`);
        }
        parts.push(`${varName} isa ${entityType}, ${has.join(", ")}`);
      }
      const q = `insert\n${parts.join(";\n")};`;
      await runWriteQueryWithRetry(q);
      if ((i + NODE_BATCH) % 400 === 0 || i + NODE_BATCH >= nodes.length) {
        console.log("  nodes inserted:", Math.min(i + NODE_BATCH, nodes.length), "/", nodes.length);
      }
    }
  } else {
    console.log("Skipping node import (--rels-only).");
  }

  const relResult = await neoSession.run(
    LIMIT_RELS != null
      ? `
    MATCH (a)-[r]->(b)
    RETURN elementId(a) AS sa, elementId(b) AS sb, type(r) AS rt, properties(r) AS props
    LIMIT $lim
  `
      : `
    MATCH (a)-[r]->(b)
    RETURN elementId(a) AS sa, elementId(b) AS sb, type(r) AS rt, properties(r) AS props
  `,
    LIMIT_RELS != null ? { lim: neo4j.int(LIMIT_RELS) } : {},
  );

  const rels = relResult.records.map((rec) => ({
    sa: rec.get("sa"),
    sb: rec.get("sb"),
    rt: rec.get("rt"),
    props: rec.get("props"),
  }));

  const relsTotal = rels.length;
  if (REL_OFFSET > 0) {
    console.log(`Slicing relationships: skipping first ${REL_OFFSET} of ${relsTotal}`);
  }
  const relsToImport = REL_OFFSET > 0 ? rels.slice(REL_OFFSET) : rels;
  console.log("Neo4j relationships to import:", relsToImport.length, `(offset ${REL_OFFSET}, total in graph ${relsTotal})`);

  function relSlug(relType) {
    return relType
      .split("_")
      .map((p) => p.toLowerCase())
      .join("-");
  }

  for (let i = 0; i < relsToImport.length; i += REL_BATCH) {
    const chunk = relsToImport.slice(i, i + REL_BATCH);
    for (const rel of chunk) {
      try {
        if (rel.sa == null || rel.sb == null || rel.rt == null) {
          console.warn("Rel skip: missing sa/sb/rt", { rt: rel.rt });
          continue;
        }
        const rslug = relSlug(rel.rt);
        const relTypeName = `aura-rel-${rslug}`;
        const rf = `${rslug}-from`;
        const rtRole = `${rslug}-to`;
        const propsObj = rel.props && typeof rel.props === "object" ? rel.props : {};
        const hasParts = [];
        for (const [key, raw] of Object.entries(propsObj)) {
          const attr = `aura-r-${rslug}-${toKebab(key)}`;
          const s = neo4jValueToString(raw);
          if (s === null) continue;
          hasParts.push(`has ${attr} "${escapeTypeqlString(s)}"`);
        }
        const hasSuffix = hasParts.length ? `,\n  ${hasParts.join(",\n  ")}` : "";
        const q = `
match
$a isa aura-imported-node, has aura-migration-neo4j-element-id "${escapeTypeqlString(rel.sa)}";
$b isa aura-imported-node, has aura-migration-neo4j-element-id "${escapeTypeqlString(rel.sb)}";
insert
$rel isa ${relTypeName},
  links (${rf}: $a, ${rtRole}: $b)${hasSuffix};
`.trim();
        await runWriteQueryWithRetry(q);
      } catch (e) {
        const head = safeNeo4jId(rel?.sa).slice(0, 24);
        console.warn("Rel skip:", rel?.rt, head, "→", String(e?.message ?? e).split("\n")[0]);
      }
    }
    const done = Math.min(i + REL_BATCH, relsToImport.length);
    if (done % 200 === 0 || done >= relsToImport.length) {
      const absolute = REL_OFFSET + done;
      console.log("  rels processed:", absolute, "/", REL_OFFSET + relsToImport.length, `(batch slice ${done}/${relsToImport.length})`);
    }
  }

  console.log("Done.");
  exitOk = true;
} catch (err) {
  console.error("Migration aborted:", err?.message ?? err);
  process.exitCode = 1;
} finally {
  await neoSession.close();
  await neoDriver.close();
  if (!exitOk && process.exitCode !== 1) {
    console.error("Migration ended without finishing (check errors above or process kill).");
  }
}
