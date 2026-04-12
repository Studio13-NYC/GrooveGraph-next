/**
 * List every entity instance with a human-readable label and the number of
 * relation instances it participates in (distinct relation IIDs per entity).
 *
 * Uses the same TYPEDB_* env contract as product/ (see product/.env.example).
 *
 * Usage:
 *   node scripts/typedb-entity-relation-table.mjs
 *   node scripts/typedb-entity-relation-table.mjs --csv > nodes.csv
 */
import path from "path";
import { fileURLToPath } from "url";
import { TypeDBHttpDriver, isApiErrorResponse } from "@typedb/driver-http";
import {
  applyDotenvFile,
  parseTypeDbConnectionString,
  conceptBinding,
} from "./lib/typedb-database-copy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

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

/** Relation types and role names (from docs/DB-Schema-Export.typeql). */
const RELATION_ROLE_SPECS = [
  ["rel-collaborated-with", ["collaborated-with-from", "collaborated-with-to"]],
  ["rel-contains", ["contains-from", "contains-to"]],
  ["rel-features", ["features-from", "features-to"]],
  ["rel-graph-rel", ["graph-rel-from", "graph-rel-to"]],
  ["rel-influenced-by", ["influenced-by-from", "influenced-by-to"]],
  ["rel-is-a", ["is-a-from", "is-a-to"]],
  ["rel-member-of", ["member-of-from", "member-of-to"]],
  ["rel-part-of-genre", ["part-of-genre-from", "part-of-genre-to"]],
  ["rel-performed-by", ["performed-by-from", "performed-by-to"]],
  ["rel-played-instrument", ["played-instrument-from", "played-instrument-to"]],
  ["rel-played-on", ["played-on-from", "played-on-to"]],
  ["rel-produced-by", ["produced-by-from", "produced-by-to"]],
  ["rel-recorded-at", ["recorded-at-from", "recorded-at-to"]],
  ["rel-recorded-in-session", ["recorded-in-session-from", "recorded-in-session-to"]],
  ["rel-released", ["released-from", "released-to"]],
  ["rel-released-by", ["released-by-from", "released-by-to"]],
  ["rel-released-on", ["released-on-from", "released-on-to"]],
  ["rel-session-includes-entity", ["session-includes-entity-from", "session-includes-entity-to"]],
  ["rel-written-by", ["written-by-from", "written-by-to"]],
  ["graph-relationship", ["source-entity", "target-entity"]],
  ["session-includes-entity", ["container-session", "member-entity"]],
];

/** Entity types to scan (isa!) and attributes to read for the display name (first non-empty wins). */
const ENTITY_NAME_ATTRS = [
  ["graph-entity", ["display-name", "normalized-name"]],
  ["research-session", ["title-string", "session-id"]],
  ["node-album", ["album-title", "album-name"]],
  ["node-artist", ["artist-name"]],
  ["node-band", ["band-name"]],
  ["node-effect", ["effect-name"]],
  ["node-entity", ["entity-display-name"]],
  ["node-entity-type", ["entity-type-name"]],
  ["node-genre", ["genre-name"]],
  ["node-graph-entity", ["graph-entity-name", "graph-entity-title"]],
  ["node-instrument", ["instrument-name", "instrument-title"]],
  ["node-label", ["label-name"]],
  ["node-performance", ["performance-name"]],
  ["node-person", ["person-name"]],
  ["node-release", ["release-title"]],
  ["node-research-session", ["research-session-title", "research-session-id"]],
  ["node-session", ["session-name", "migrated-session-id"]],
  ["node-studio", ["studio-name"]],
  ["node-track", ["track-title", "track-name"]],
];

function markdownEscape(s) {
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

applyDotenvFile(path.join(repoRoot, "product", ".env.local"));
applyDotenvFile(path.join(repoRoot, ".env.local"));

const csv = process.argv.includes("--csv");

const cfg = getTypeDbConfig();
if (!cfg) {
  console.error(
    "Missing TypeDB config. Set TYPEDB_USERNAME, TYPEDB_PASSWORD, TYPEDB_ADDRESS (or TYPEDB_HOST), TYPEDB_DATABASE, or TYPEDB_CONNECTION_STRING in product/.env.local.",
  );
  process.exit(1);
}

const driver = new TypeDBHttpDriver({
  username: cfg.username,
  password: cfg.password,
  addresses: cfg.addresses,
});

/** @type {Map<string, { label: string, typeLabel: string }>} */
const entities = new Map();
/** @type {Map<string, Set<string>>} */
const relsByEntity = new Map();

function ensureEntity(iid, typeLabel, label) {
  if (!entities.has(iid)) {
    entities.set(iid, { label: label || `${typeLabel}|${iid}`, typeLabel });
    relsByEntity.set(iid, new Set());
  } else if (label) {
    const cur = entities.get(iid);
    const placeholder = cur.typeLabel === "unknown" || /^\S+\|[0-9a-f-]{20,}$/i.test(cur.label);
    if (placeholder) {
      cur.label = label;
      if (typeLabel && typeLabel !== "unknown") cur.typeLabel = typeLabel;
    }
  }
}

async function runQuery(q, label) {
  const res = await driver.oneShotQuery(q.trim(), false, cfg.database, "read");
  if (isApiErrorResponse(res)) {
    throw new Error(`${label}: ${res.err?.message ?? JSON.stringify(res)}`);
  }
  return res.ok;
}

// 1) Load entities + names
for (const [typeLabel, attrs] of ENTITY_NAME_ATTRS) {
  const attrList = attrs.join(", ");
  const q = `
match $e isa! ${typeLabel};
fetch $e: ${attrList};
`.trim();
  const ok = await runQuery(q, `fetch-${typeLabel}`);
  if (ok.answerType !== "conceptDocuments" || !ok.answers?.length) {
    continue;
  }
  for (const doc of ok.answers) {
    const eDoc = doc?.e;
    if (!eDoc || typeof eDoc !== "object") continue;
    const iid = eDoc.iid;
    if (!iid) continue;
    let label = "";
    for (const a of attrs) {
      const v = eDoc[a];
      if (v == null) continue;
      const s =
        typeof v === "object" && "value" in v ? String(v.value ?? "").trim() : String(v).trim();
      if (s) {
        label = s;
        break;
      }
    }
    ensureEntity(String(iid), typeLabel, label || `${typeLabel}|${iid}`);
  }
}

const PAGE = 500;

// 2) Count relation instances per entity (distinct relation IID)
for (const [relType, roles] of RELATION_ROLE_SPECS) {
  for (const role of roles) {
    let offset = 0;
    for (;;) {
      const q = `
match $r isa! ${relType}, links (${role}: $e);
offset ${offset};
limit ${PAGE};
`.trim();
      const ok = await runQuery(q, `links-${relType}-${role}-${offset}`);
      if (ok.answerType !== "conceptRows" || !ok.answers?.length) {
        break;
      }
      for (const ans of ok.answers) {
        const row = ans.data;
        if (!row) continue;
        const eC = conceptBinding(row, "e");
        const rC = conceptBinding(row, "r");
        const eiid = eC?.iid != null ? String(eC.iid) : null;
        const riid = rC?.iid != null ? String(rC.iid) : null;
        const tlab = eC?.type?.label ?? "unknown";
        if (!eiid || !riid) continue;
        ensureEntity(eiid, tlab, "");
        const set = relsByEntity.get(eiid);
        if (set) set.add(riid);
      }
      if (ok.answers.length < PAGE) break;
      offset += PAGE;
    }
  }
}

if (entities.size === 0) {
  console.error("No entities returned; check database name and schema.");
  process.exit(2);
}

const rows = [...entities.entries()]
  .map(([iid, meta]) => ({
    iid,
    name: meta.label,
    typeLabel: meta.typeLabel,
    count: relsByEntity.get(iid)?.size ?? 0,
  }))
  .sort((a, b) => {
    const c = a.name.localeCompare(b.name);
    if (c !== 0) return c;
    return a.iid.localeCompare(b.iid);
  });

if (csv) {
  console.log("entity_name,entity_type,entity_iid,relationship_count");
  for (const r of rows) {
    const name = `"${r.name.replace(/"/g, '""')}"`;
    console.log(`${name},${r.typeLabel},${r.iid},${r.count}`);
  }
  process.exit(0);
}

const totalRels = rows.reduce((s, r) => s + r.count, 0);
console.log(
  `Database: ${cfg.database} — entity instances: ${rows.length} — sum of per-entity relation-instance counts: ${totalRels} (each relation instance counted once per endpoint entity; a relation with two distinct entities contributes 1 to each).`,
);
console.log("");
console.log("| Entity name | Relationships |");
console.log("| --- | ---: |");
for (const r of rows) {
  console.log(`| ${markdownEscape(r.name)} | ${r.count} |`);
}
