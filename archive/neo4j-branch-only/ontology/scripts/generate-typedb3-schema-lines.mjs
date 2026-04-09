/**
 * Emit TypeDB 3.x one-statement-per-query schema lines from neo4j-introspection.json.
 *
 *   node ontology/scripts/generate-typedb3-schema-lines.mjs [input.json] [output.json]
 *
 * Default: ontology/sources/neo4j-introspection.json → ontology/sources/typedb3-schema-lines.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootOntology = resolve(__dirname, "..");
const defaultIn = resolve(rootOntology, "sources/neo4j-introspection.json");
const defaultOut = resolve(rootOntology, "sources/typedb3-schema-lines.json");

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
  if (t.includes("array") || t.includes("object")) return "string";
  if (t.includes("integer") && !t.includes("float")) return "long";
  if (t.includes("float")) return "double";
  if (t.includes("boolean")) return "boolean";
  return "string";
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

const lines = [];
lines.push(
  `// typedb3-schema-lines from Neo4j introspection ${introspectedAt} db=${database} host=${uriHost ?? "?"}`,
);

const seenAttr = new Set();
function pushAttr(name, valueType) {
  if (seenAttr.has(name)) return;
  seenAttr.add(name);
  lines.push(`define attribute ${name}, value ${valueType};`);
}

pushAttr("aura-migration-neo4j-element-id", "string");

for (const label of labels) {
  const slug = labelSlug(label);
  const props = propertiesByLabel[label] ?? {};
  if (props.id !== undefined) {
    pushAttr(`aura-${slug}-id`, "string");
  }
  for (const prop of Object.keys(props).sort()) {
    if (prop === "id") continue;
    pushAttr(`aura-${slug}-${toKebab(prop)}`, valueClause(props[prop]));
  }
}

for (const relType of relationshipTypes) {
  const rslug = relSlug(relType);
  const props = propertiesByRelType[relType] ?? {};
  for (const prop of Object.keys(props).sort()) {
    pushAttr(`aura-r-${rslug}-${toKebab(prop)}`, valueClause(props[prop]));
  }
}

lines.push("define entity aura-imported-node;");
lines.push("define aura-imported-node owns aura-migration-neo4j-element-id;");

for (const label of labels) {
  const slug = labelSlug(label);
  const entityName = `aura-node-${slug}`;
  lines.push(`define entity ${entityName} sub aura-imported-node;`);
}

for (const label of labels) {
  const slug = labelSlug(label);
  const entityName = `aura-node-${slug}`;
  const props = propertiesByLabel[label] ?? {};
  if (props.id !== undefined) {
    lines.push(`define ${entityName} owns aura-${slug}-id @key;`);
  }
  for (const prop of Object.keys(props).sort()) {
    if (prop === "id") continue;
    lines.push(`define ${entityName} owns aura-${slug}-${toKebab(prop)};`);
  }
}

for (const relType of relationshipTypes) {
  const rslug = relSlug(relType);
  const relName = `aura-rel-${rslug}`;
  const rf = roleFrom(rslug);
  const rt = roleTo(rslug);
  lines.push(`define relation ${relName}, relates ${rf}, relates ${rt};`);
  const props = propertiesByRelType[relType] ?? {};
  for (const prop of Object.keys(props).sort()) {
    lines.push(`define ${relName} owns aura-r-${rslug}-${toKebab(prop)};`);
  }
}

for (const relType of relationshipTypes) {
  const rslug = relSlug(relType);
  const relName = `aura-rel-${rslug}`;
  const rf = roleFrom(rslug);
  const rt = roleTo(rslug);
  lines.push(`define aura-imported-node plays ${relName}:${rf};`);
  lines.push(`define aura-imported-node plays ${relName}:${rt};`);
}

const meta = {
  sourceIntrospection: introspectedAt,
  neo4jDatabase: database,
  neo4jHost: uriHost,
  labelCount: labels.length,
  relationshipTypeCount: relationshipTypes.length,
  nodeCountByLabel,
  relCountByType,
};

writeFileSync(outputPath, JSON.stringify({ meta, schemaLines: lines }, null, 2), "utf8");
console.log(`Wrote ${outputPath} (${lines.length} lines)`);
