/**
 * Generate TypeQL from ontology/sources/neo4j-introspection.json (Aura / Neo4j snapshot).
 *
 *   node ontology/scripts/generate-typeql-from-introspection.mjs [input.json] [output.tql]
 *
 * Defaults: ontology/sources/neo4j-introspection.json → ontology/groovegraph-neo4j-aura-snapshot.tql
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootOntology = resolve(__dirname, "..");
const defaultIn = resolve(rootOntology, "sources/neo4j-introspection.json");
const defaultOut = resolve(rootOntology, "groovegraph-neo4j-aura-snapshot.tql");

const inputPath = resolve(process.argv[2] ?? defaultIn);
const outputPath = resolve(process.argv[3] ?? defaultOut);

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

function relSlug(relType) {
  return relType
    .split("_")
    .map((p) => p.toLowerCase())
    .join("-");
}

function roleFrom(relSlugStr) {
  return `${relSlugStr}-from`;
}

function roleTo(relSlugStr) {
  return `${relSlugStr}-to`;
}

function valueClause(types) {
  const t = Array.isArray(types) ? types : [];
  if (t.includes("array") || t.includes("object")) return "value string";
  if (t.includes("integer") && !t.includes("float")) return "value long";
  if (t.includes("float")) return "value double";
  if (t.includes("boolean")) return "value boolean";
  return "value string";
}

const data = JSON.parse(readFileSync(inputPath, "utf8"));
const {
  introspectedAt,
  database,
  uriHost,
  labels,
  relationshipTypes,
  nodeCountByLabel,
  relCountByType,
  propertiesByLabel,
  propertiesByRelType,
} = data;

const attrDefs = [];
const seenAttr = new Set();

function defineAttr(line) {
  const name = line.split(" ")[0];
  if (seenAttr.has(name)) return;
  seenAttr.add(name);
  attrDefs.push(line);
}

const entityBlocks = [];

for (const label of labels) {
  const slug = labelSlug(label);
  const props = propertiesByLabel[label] ?? {};
  const entityName = `aura-node-${slug}`;
  const ownsLines = [];

  if (props.id !== undefined) {
    const attr = `aura-${slug}-id`;
    defineAttr(`${attr} sub attribute, value string;`);
    ownsLines.push(`  owns ${attr} @key`);
  }

  for (const prop of Object.keys(props).sort()) {
    if (prop === "id") continue;
    const attr = `aura-${slug}-${toKebab(prop)}`;
    defineAttr(`${attr} sub attribute, ${valueClause(props[prop])};`);
    ownsLines.push(`  owns ${attr}`);
  }

  if (ownsLines.length === 0) {
    entityBlocks.push(`# Neo4j :${label} (no sampled properties)`);
    entityBlocks.push(`${entityName} sub aura-imported-node;`);
  } else {
    entityBlocks.push(`# Neo4j :${label} (nodes ≈ ${nodeCountByLabel[label] ?? "?"})`);
    entityBlocks.push(`${entityName} sub aura-imported-node,`);
    entityBlocks.push(ownsLines.join(",\n") + ";");
  }
  entityBlocks.push("");
}

const relBlocks = [];
const playsLines = [];

for (const relType of relationshipTypes) {
  const rslug = relSlug(relType);
  const relName = `aura-rel-${rslug}`;
  const rf = roleFrom(rslug);
  const rt = roleTo(rslug);
  const props = propertiesByRelType[relType] ?? {};
  const ownsLines = [];

  for (const prop of Object.keys(props).sort()) {
    const attr = `aura-r-${rslug}-${toKebab(prop)}`;
    defineAttr(`${attr} sub attribute, ${valueClause(props[prop])};`);
    ownsLines.push(`  owns ${attr}`);
  }

  relBlocks.push(`# Neo4j :${relType} (edges ≈ ${relCountByType[relType] ?? "?"})`);
  relBlocks.push(`${relName} sub relation,`);
  relBlocks.push(`  relates ${rf},`);
  relBlocks.push(`  relates ${rt}`);
  if (ownsLines.length) {
    relBlocks[relBlocks.length - 1] += ",";
    for (let i = 0; i < ownsLines.length; i++) {
      relBlocks.push(i < ownsLines.length - 1 ? `${ownsLines[i]},` : `${ownsLines[i]};`);
    }
  } else {
    relBlocks[relBlocks.length - 1] += ";";
  }
  relBlocks.push("");

  playsLines.push(`aura-imported-node plays ${relName}:${rf};`);
  playsLines.push(`aura-imported-node plays ${relName}:${rt};`);
}

const out = [];
out.push("/**");
out.push(" * AUTO-GENERATED from Neo4j Aura introspection.");
out.push(` * Source JSON: ${introspectedAt}`);
out.push(` * Database: ${database} @ ${uriHost ?? "?"}`);
out.push(" *");
out.push(" * Regenerate: npm run introspect-neo4j (research-workbench) then:");
out.push(" *   node ontology/scripts/generate-typeql-from-introspection.mjs");
out.push(" *");
out.push(" * Load alongside groovegraph-schema.tql for migration planning.");
out.push(" * Neo4j label :Entity → aura-node-entity; workbench graph-entity is the canonical");
out.push(" * TypeDB name for the same role — merge or link during normalization.");
out.push(" */");
out.push("");
out.push("define");
out.push("");
out.push("# Supertype: all Neo4j-exported nodes can play ends of aura-rel-* relations.");
out.push("aura-imported-node sub entity;");
out.push("");
out.push("# --- Attributes (prefixed by label or relationship to avoid collisions) ---");
out.push("");
out.push(...attrDefs.sort());
out.push("");
out.push("# --- Entities (one per Neo4j label in the snapshot) ---");
out.push("");
out.push(...entityBlocks);
out.push("# --- Relations (one per Neo4j relationship type) ---");
out.push("");
out.push(...relBlocks);
out.push("# --- Role players ---");
out.push("");
out.push(...playsLines);

writeFileSync(outputPath, out.join("\n") + "\n", "utf8");
console.log(`Wrote ${outputPath} (${labels.length} labels, ${relationshipTypes.length} rel types)`);
