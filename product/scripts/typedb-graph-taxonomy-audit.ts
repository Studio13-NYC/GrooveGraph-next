/**
 * Audit the workbench graph in TypeDB (`graph-entity` / `graph-relationship`) and
 * optionally add missing taxonomy links: concrete instrument-like entities →
 * canonical **Instrument** hub via `rel-verb` **is-a** (matches Vocals/Guitar → Instrument).
 *
 * Requires `product/.env.local` TypeDB settings (same as the app).
 *
 * From repo root:
 *   npm run typedb:graph-taxonomy -w @groovegraph-next/product
 * From `product/`:
 *   npm run typedb:graph-taxonomy
 *
 * Dry-run (default): prints counts + candidates that would get `is-a` edges.
 * Apply:
 *   npm run typedb:graph-taxonomy -w @groovegraph-next/product -- --apply
 */
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ConceptRow } from "@typedb/driver-http";
import { candidateKey, escapeTypeqlString, normalizeName } from "@/src/lib/server/graph-persistence/helpers";
import {
  commitTx,
  createTypeDbScriptRunner,
  openReadTx,
  openWriteTx,
  rollbackTx,
  runInTx,
} from "@/src/lib/server/typedb-script-runner";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TAX_SESSION = "graph-taxonomy";
const HUB_ENTITY_ID = "hub-instrument";
const HUB_DISPLAY = "Instrument";
const HUB_KIND = "instrument";

/** Names / tokens that suggest a concrete instrument or vocal (not the abstract hub). */
const INSTRUMENTISH_NAME =
  /\b(guitars?|electric\s+guitar|acoustic\s+guitar|bass(?:\s+guitar)?|drums?|drum\s*kit|keyboard|keyboards?|synth(?:esizer)?|synthesizers?|piano|organ|cello|violin|viola|trumpet|sax(?:ophone)?|flute|clarinet|trombone|harmonica|vocals?|vocal|microphones?|\bmics?\b|amplifiers?|\bamps?\b|pedals?|cabinets?|strings?|effects?|dj[-\s]?equipment)\b/i;

const INSTRUMENTISH_KIND = /^(gear|instrument|effect|technology|product|artifact)$/i;

/** Kinds that are always modeled as concrete instruments / gear in this graph. */
const ALWAYS_INSTRUMENT_KIND =
  /^(musicalinstrument|guitarmodel|guitarbrand|instrument\s*model|amplifier\s*model|effect\s*type)$/i;

function nowIso(): string {
  return new Date().toISOString();
}

function attributeValue(row: ConceptRow, varName: string): string | null {
  const concept = row[varName];
  if (concept?.kind === "attribute") {
    const v = concept.value;
    return v === undefined || v === null ? null : String(v);
  }
  return null;
}

function entityIidFromRow(row: ConceptRow, varName: string): string | null {
  const concept = row[varName];
  if (concept?.kind === "entity" && concept.iid) {
    return String(concept.iid);
  }
  return null;
}

type GraphEntityRow = {
  iid: string;
  displayName: string;
  provisionalKind: string;
  normalizedName: string;
  keysJson: string;
};

function parseEntityRows(res: { answerType?: string; answers?: { data: ConceptRow }[] }): GraphEntityRow[] {
  if (res.answerType !== "conceptRows" || !res.answers?.length) {
    return [];
  }
  const out: GraphEntityRow[] = [];
  for (const { data: row } of res.answers) {
    const iid = entityIidFromRow(row, "e");
    if (!iid) continue;
    out.push({
      iid,
      displayName: attributeValue(row, "dn")?.trim() ?? "",
      provisionalKind: attributeValue(row, "pk")?.trim() ?? "",
      normalizedName: attributeValue(row, "nn")?.trim() ?? "",
      keysJson: attributeValue(row, "jk")?.trim() ?? "[]",
    });
  }
  return out;
}

function isHubKeyRow(keysJson: string): boolean {
  const needle = candidateKey(TAX_SESSION, HUB_ENTITY_ID);
  return keysJson.includes(needle);
}

function shouldLinkInstrumentish(row: GraphEntityRow, hubIid: string | null): boolean {
  if (hubIid && row.iid === hubIid) return false;
  if (isHubKeyRow(row.keysJson)) return false;
  const pk = row.provisionalKind.trim();
  const nn = row.normalizedName.toLowerCase();
  const dn = row.displayName.toLowerCase();
  /** Existing abstract “Instrument” category node — link others *to* this, not from it. */
  if (nn === "instrument" && dn === "instrument" && /^instrument$/i.test(pk)) {
    return false;
  }
  if (ALWAYS_INSTRUMENT_KIND.test(pk.replace(/\s+/g, ""))) {
    return true;
  }
  if (INSTRUMENTISH_NAME.test(nn) || INSTRUMENTISH_NAME.test(dn)) {
    return true;
  }
  if (INSTRUMENTISH_KIND.test(pk)) {
    return (
      INSTRUMENTISH_NAME.test(nn) ||
      INSTRUMENTISH_NAME.test(dn) ||
      /\b(instrument|gear|effect|pedal|amp|cab)\b/i.test(dn)
    );
  }
  return false;
}

function stableRelId(srcIid: string): string {
  return createHash("sha256").update(`is-a|instrument|${srcIid}`).digest("hex").slice(0, 24);
}

function edgeKeyFor(srcIid: string): string {
  return `${TAX_SESSION}:${stableRelId(srcIid)}`;
}

async function matchHubIid(driver: ReturnType<typeof createTypeDbScriptRunner>["driver"], db: string): Promise<string | null> {
  const txId = await openReadTx(driver, db);
  try {
    const needle = escapeTypeqlString(candidateKey(TAX_SESSION, HUB_ENTITY_ID));
    const q = `
match
$e isa! graph-entity, has entity-candidate-keys-json $jk;
$jk contains "${needle}";
`.trim();
    const res = await runInTx(driver, txId, q, "matchInstrumentHub");
    if (res.answerType !== "conceptRows" || !res.answers?.length) {
      return null;
    }
    return entityIidFromRow(res.answers[0].data, "e");
  } finally {
    await rollbackTx(driver, txId);
  }
}

async function findExistingInstrumentCategoryIid(
  driver: ReturnType<typeof createTypeDbScriptRunner>["driver"],
  db: string,
): Promise<string | null> {
  const txId = await openReadTx(driver, db);
  try {
    const q = `
match
$e isa! graph-entity,
  has display-name $dn,
  has provisional-entity-kind $pk;
$dn == "Instrument";
$pk == "instrument";
`.trim();
    const res = await runInTx(driver, txId, q, "readInstrumentCategory");
    if (res.answerType !== "conceptRows" || !res.answers?.length) {
      return null;
    }
    return entityIidFromRow(res.answers[0].data, "e");
  } finally {
    await rollbackTx(driver, txId);
  }
}

async function hasIsAToTargetInTx(
  driver: ReturnType<typeof createTypeDbScriptRunner>["driver"],
  txId: string,
  srcIid: string,
  tgtIid: string,
): Promise<boolean> {
  const q = `
match
$src iid ${srcIid};
$src isa! graph-entity;
$tgt iid ${tgtIid};
$tgt isa! graph-entity;
$r isa! graph-relationship,
  links (source-entity: $src, target-entity: $tgt),
  has rel-verb $v;
$v == "is-a";
`.trim();
  const res = await runInTx(driver, txId, q, "matchIsA");
  return res.answerType === "conceptRows" && Boolean(res.answers?.length);
}

async function ensureTaxonomySession(driver: ReturnType<typeof createTypeDbScriptRunner>["driver"], db: string, txId: string) {
  const sid = escapeTypeqlString(TAX_SESSION);
  const matchExisting = `
match $s isa! research-session, has session-id $sid;
$sid == "${sid}";
`.trim();
  const existing = await runInTx(driver, txId, matchExisting, "matchTaxonomySession");
  const has = existing.answerType === "conceptRows" && Boolean(existing.answers?.length);
  const updated = escapeTypeqlString(nowIso());
  if (has) {
    const upd = `
match $s isa! research-session, has session-id $sid;
$sid == "${sid}";
update
$s has title-string "Graph taxonomy maintenance",
  has seed-query-text "Synthetic session for is-a taxonomy links.",
  has session-updated-at "${updated}";
`.trim();
    await runInTx(driver, txId, upd, "updateTaxonomySession");
    return;
  }
  const ins = `
insert
$s isa research-session,
  has session-id "${sid}",
  has title-string "Graph taxonomy maintenance",
  has seed-query-text "Synthetic session for is-a taxonomy links.",
  has session-updated-at "${updated}";
`.trim();
  await runInTx(driver, txId, ins, "insertTaxonomySession");
}

async function ensureInstrumentHub(
  driver: ReturnType<typeof createTypeDbScriptRunner>["driver"],
  db: string,
  txId: string,
): Promise<string> {
  const needle = escapeTypeqlString(candidateKey(TAX_SESSION, HUB_ENTITY_ID));
  const matchHub = `
match
$e isa! graph-entity, has entity-candidate-keys-json $jk;
$jk contains "${needle}";
`.trim();
  const found = await runInTx(driver, txId, matchHub, "matchHubInTx");
  if (found.answerType === "conceptRows" && found.answers?.length) {
    const iid = entityIidFromRow(found.answers[0].data, "e");
    if (iid) return iid;
  }

  const matchExistingInstrument = `
match
$e isa! graph-entity,
  has display-name $dn,
  has provisional-entity-kind $pk;
$dn == "Instrument";
$pk == "instrument";
`.trim();
  const existingInst = await runInTx(driver, txId, matchExistingInstrument, "matchExistingInstrumentNode");
  if (existingInst.answerType === "conceptRows" && existingInst.answers?.length) {
    const iid = entityIidFromRow(existingInst.answers[0].data, "e");
    if (iid) {
      console.log("Using existing graph-entity Instrument [instrument] as taxonomy target.");
      return iid;
    }
  }

  const display = escapeTypeqlString(HUB_DISPLAY);
  const nn = escapeTypeqlString(normalizeName(HUB_DISPLAY));
  const pk = escapeTypeqlString(HUB_KIND);
  const st = escapeTypeqlString("accepted");
  const updated = escapeTypeqlString(nowIso());
  const created = updated;
  const lastSess = escapeTypeqlString(TAX_SESSION);
  const ck = candidateKey(TAX_SESSION, HUB_ENTITY_ID);
  const keys = escapeTypeqlString(JSON.stringify([ck]));
  const aliases = escapeTypeqlString(JSON.stringify([]));
  const ext = escapeTypeqlString(JSON.stringify([`taxonomy:${TAX_SESSION}:${HUB_ENTITY_ID}`]));
  const attrs = escapeTypeqlString(JSON.stringify({ taxonomy_role: "category_hub" }));
  const evid = escapeTypeqlString(JSON.stringify([]));

  const ins = `
insert
$e isa graph-entity,
  has display-name "${display}",
  has normalized-name "${nn}",
  has provisional-entity-kind "${pk}",
  has review-status "${st}",
  has entity-aliases-json "${aliases}",
  has entity-external-ids-json "${ext}",
  has entity-attributes-json "${attrs}",
  has entity-evidence-snippet-ids-json "${evid}",
  has entity-candidate-keys-json "${keys}",
  has entity-created-at "${created}",
  has entity-updated-at "${updated}",
  has entity-last-session-id "${lastSess}";
`.trim();
  await runInTx(driver, txId, ins, "insertInstrumentHub");

  const again = await runInTx(driver, txId, matchHub, "matchHubAfterInsert");
  const iid = again.answerType === "conceptRows" && again.answers?.length ? entityIidFromRow(again.answers[0].data, "e") : null;
  if (!iid) {
    throw new Error("Failed to resolve Instrument hub IID after insert.");
  }
  return iid;
}

async function insertIsA(
  driver: ReturnType<typeof createTypeDbScriptRunner>["driver"],
  txId: string,
  srcIid: string,
  tgtIid: string,
): Promise<void> {
  const ek = escapeTypeqlString(edgeKeyFor(srcIid));
  const rsid = escapeTypeqlString(TAX_SESSION);
  const rid = escapeTypeqlString(stableRelId(srcIid));
  const verb = escapeTypeqlString("is-a");
  const conf = escapeTypeqlString("high");
  const rst = escapeTypeqlString("accepted");
  const evid = escapeTypeqlString(JSON.stringify([]));
  const updated = escapeTypeqlString(nowIso());

  const ins = `
match
$src iid ${srcIid};
$src isa! graph-entity;
$tgt iid ${tgtIid};
$tgt isa! graph-entity;
insert
$r isa graph-relationship,
  links (source-entity: $src, target-entity: $tgt),
  has graph-rel-edge-key "${ek}",
  has rel-session-id "${rsid}",
  has rel-relationship-id "${rid}",
  has rel-verb "${verb}",
  has rel-confidence "${conf}",
  has rel-review-status "${rst}",
  has rel-evidence-snippet-ids-json "${evid}",
  has rel-updated-at "${updated}";
`.trim();
  await runInTx(driver, txId, ins, "insertIsA");
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const { driver, database } = createTypeDbScriptRunner();
  console.log(`TypeDB database: ${database}`);
  console.log(`Mode: ${apply ? "APPLY (writes)" : "dry-run (read only)"}`);
  console.log(`CWD: ${process.cwd()} (script dir: ${__dirname})\n`);

  const readTx = await openReadTx(driver, database);
  let entities: GraphEntityRow[] = [];
  try {
    const q = `
match
$e isa! graph-entity,
  has display-name $dn,
  has provisional-entity-kind $pk,
  has normalized-name $nn,
  has entity-candidate-keys-json $jk;
`.trim();
    const res = await runInTx(driver, readTx, q, "listGraphEntities");
    entities = parseEntityRows(res);
  } finally {
    await rollbackTx(driver, readTx);
  }

  const byKind = new Map<string, number>();
  for (const e of entities) {
    const k = e.provisionalKind || "(empty)";
    byKind.set(k, (byKind.get(k) ?? 0) + 1);
  }
  console.log("Entities by provisional-entity-kind:");
  for (const [k, c] of [...byKind.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c}\t${k}`);
  }
  console.log(`\nTotal graph-entity: ${entities.length}`);

  const keyedHub = await matchHubIid(driver, database);
  const namedInstrument = await findExistingInstrumentCategoryIid(driver, database);
  const preInstrumentCategoryIid = keyedHub ?? namedInstrument;
  if (!preInstrumentCategoryIid && !apply) {
    console.log("\n(No Instrument category node found — run with --apply to create session + hub + links.)");
  } else if (!apply && namedInstrument) {
    console.log("\nFound existing Instrument [instrument] node — `is-a` links will point there when you use --apply.");
  }

  const candidates = entities.filter((e) => shouldLinkInstrumentish(e, preInstrumentCategoryIid));
  console.log(`\nInstrument-like candidates (heuristic): ${candidates.length}`);
  for (const c of candidates.slice(0, 40)) {
    console.log(`  - ${c.displayName} [${c.provisionalKind}] (${c.iid.slice(0, 24)}…)`);
  }
  if (candidates.length > 40) {
    console.log(`  … ${candidates.length - 40} more`);
  }

  if (!apply) {
    console.log("\nNext: review heuristics in scripts/typedb-graph-taxonomy-audit.ts, then:");
    console.log(`  npm run typedb:graph-taxonomy -w @groovegraph-next/product -- --apply`);
    return;
  }

  const writeTx = await openWriteTx(driver, database);
  try {
    await ensureTaxonomySession(driver, database, writeTx);
    const instrumentTargetIid = await ensureInstrumentHub(driver, database, writeTx);

    let inserted = 0;
    let skipped = 0;
    for (const row of candidates) {
      if (row.iid === instrumentTargetIid) {
        skipped += 1;
        continue;
      }
      if (await hasIsAToTargetInTx(driver, writeTx, row.iid, instrumentTargetIid)) {
        skipped += 1;
        continue;
      }
      await insertIsA(driver, writeTx, row.iid, instrumentTargetIid);
      inserted += 1;
      console.log(`Linked is-a: "${row.displayName}" → Instrument`);
    }
    await commitTx(driver, writeTx);
    console.log(`\nDone. Inserted ${inserted} is-a relationship(s); skipped ${skipped} (already linked or hub).`);
  } catch (e) {
    await rollbackTx(driver, writeTx);
    throw e;
  }
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
