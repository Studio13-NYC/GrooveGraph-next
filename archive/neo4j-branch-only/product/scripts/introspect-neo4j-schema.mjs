/**
 * Introspect live Neo4j: labels, relationship types, property keys, counts.
 * Writes JSON for ontology alignment (Neo4j → TypeDB migration).
 *
 *   node --env-file=.env.local scripts/introspect-neo4j-schema.mjs [outPath]
 *
 * Default outPath: ../../ontology/sources/neo4j-introspection.json (repo root ontology/)
 */
import neo4j from "neo4j-driver";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** GrooveGraph repo root (this script lives under archive/neo4j-branch-only/product/scripts/). */
const repoRoot = resolve(__dirname, "../../../..");

const uri = process.env.NEO4J_URI?.trim();
const user = (process.env.NEO4J_USERNAME ?? process.env.NEO4J_USER)?.trim();
const password = process.env.NEO4J_PASSWORD?.trim();
const database = process.env.NEO4J_DATABASE?.trim() || "neo4j";

const defaultOut = resolve(
  repoRoot,
  "archive/neo4j-branch-only/ontology/sources/neo4j-introspection.json",
);
const outPath = resolve(process.argv[2] ?? defaultOut);

if (!uri || !user || !password) {
  console.error("Missing NEO4J_URI, NEO4J_USERNAME (or NEO4J_USER), or NEO4J_PASSWORD.");
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session({ database });

function neo4jValueType(v) {
  if (v === null || v === undefined) return "null";
  if (neo4j.isInt(v)) return "integer";
  const t = typeof v;
  if (t === "number") return Number.isInteger(v) ? "integer" : "float";
  if (t === "boolean") return "boolean";
  if (t === "string") return "string";
  if (Array.isArray(v)) return "array";
  if (t === "object") return "object";
  return t;
}

async function trySchemaProcedures() {
  const nodeProps = [];
  const relProps = [];
  try {
    const n = await session.run(`CALL db.schema.nodeTypeProperties() YIELD nodeLabels, propertyName, propertyTypes, mandatory RETURN nodeLabels, propertyName, propertyTypes, mandatory`);
    for (const rec of n.records) {
      nodeProps.push({
        nodeLabels: rec.get("nodeLabels"),
        propertyName: rec.get("propertyName"),
        propertyTypes: rec.get("propertyTypes"),
        mandatory: rec.get("mandatory"),
      });
    }
  } catch {
    /* older Neo4j or Aura restriction */
  }
  try {
    const r = await session.run(
      `CALL db.schema.relTypeProperties() YIELD relType, propertyName, propertyTypes, mandatory RETURN relType, propertyName, propertyTypes, mandatory`,
    );
    for (const rec of r.records) {
      relProps.push({
        relType: rec.get("relType"),
        propertyName: rec.get("propertyName"),
        propertyTypes: rec.get("propertyTypes"),
        mandatory: rec.get("mandatory"),
      });
    }
  } catch {
    /* optional */
  }
  return { nodeProps, relProps };
}

async function labelsFromCatalog() {
  const result = await session.run(`CALL db.labels() YIELD label RETURN label ORDER BY label`);
  return result.records.map((rec) => rec.get("label"));
}

async function relTypesFromCatalog() {
  const result = await session.run(`CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType ORDER BY relationshipType`);
  return result.records.map((rec) => rec.get("relationshipType"));
}

async function labelCounts() {
  const result = await session.run(`
    MATCH (n)
    UNWIND labels(n) AS label
    RETURN label, count(*) AS nodeCount
    ORDER BY label
  `);
  const map = {};
  for (const rec of result.records) {
    map[rec.get("label")] = rec.get("nodeCount").toNumber();
  }
  return map;
}

async function relTypeCounts() {
  const result = await session.run(`
    MATCH ()-[r]->()
    RETURN type(r) AS relType, count(*) AS relCount
    ORDER BY relType
  `);
  const map = {};
  for (const rec of result.records) {
    map[rec.get("relType")] = rec.get("relCount").toNumber();
  }
  return map;
}

/** Sample property keys and inferred value types from graph data (fallback / supplement). */
async function samplePropertiesByLabel(label) {
  const result = await session.run(
    `
    MATCH (n)
    WHERE $label IN labels(n)
    WITH n LIMIT 500
    RETURN keys(n) AS ks
    `,
    { label },
  );
  const keyTypes = new Map();
  for (const rec of result.records) {
    const keys = rec.get("ks") ?? [];
    for (const key of keys) {
      if (!keyTypes.has(key)) keyTypes.set(key, new Set());
    }
  }
  const withValues = await session.run(
    `
    MATCH (n)
    WHERE $label IN labels(n)
    WITH n LIMIT 200
    RETURN properties(n) AS props
    `,
    { label },
  );
  for (const rec of withValues.records) {
    const props = rec.get("props") ?? {};
    for (const [key, val] of Object.entries(props)) {
      if (!keyTypes.has(key)) keyTypes.set(key, new Set());
      keyTypes.get(key).add(neo4jValueType(val));
    }
  }
  return Object.fromEntries(
    [...keyTypes.entries()].map(([k, set]) => [k, [...set].sort()]),
  );
}

async function samplePropertiesByRelType(relType) {
  const result = await session.run(
    `
    MATCH ()-[r]->()
    WHERE type(r) = $relType
    WITH r LIMIT 200
    RETURN properties(r) AS props
    `,
    { relType },
  );
  const keyTypes = new Map();
  for (const rec of result.records) {
    const props = rec.get("props") ?? {};
    for (const [key, val] of Object.entries(props)) {
      if (!keyTypes.has(key)) keyTypes.set(key, new Set());
      keyTypes.get(key).add(neo4jValueType(val));
    }
  }
  return Object.fromEntries(
    [...keyTypes.entries()].map(([k, set]) => [k, [...set].sort()]),
  );
}

try {
  await driver.verifyConnectivity();
  const introspectedAt = new Date().toISOString();

  const labels = await labelsFromCatalog();
  const relationshipTypes = await relTypesFromCatalog();
  const { nodeProps, relProps } = await trySchemaProcedures();
  const nodeCountByLabel = await labelCounts();
  const relCountByType = await relTypeCounts();

  const propertiesByLabel = {};
  for (const label of labels) {
    propertiesByLabel[label] = await samplePropertiesByLabel(label);
  }

  const propertiesByRelType = {};
  for (const rt of relationshipTypes) {
    propertiesByRelType[rt] = await samplePropertiesByRelType(rt);
  }

  const payload = {
    introspectedAt,
    database,
    uriHost: (() => {
      try {
        return new URL(uri).host;
      } catch {
        return null;
      }
    })(),
    labels,
    relationshipTypes,
    nodeCountByLabel,
    relCountByType,
    schemaProcedureNodeProperties: nodeProps.length ? nodeProps : undefined,
    schemaProcedureRelProperties: relProps.length ? relProps : undefined,
    propertiesByLabel,
    propertiesByRelType,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${outPath}`);
  console.log(`Labels (${labels.length}):`, labels.join(", ") || "—");
  console.log(`Relationship types (${relationshipTypes.length}):`, relationshipTypes.join(", ") || "—");
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await session.close();
  await driver.close();
}
