/**
 * Shared helpers for logical TypeDB database copy via HTTP driver (entities + relations).
 * Used by migrate-typedb-strip-aura-prefix.mjs and typedb-promote-migrate-temp.mjs.
 */
import fs from "fs";
import { isApiErrorResponse } from "@typedb/driver-http";

export function applyDotenvFile(filePath) {
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

function parseTypeDbConnectionStringLegacy(cs) {
  const m = cs.match(/typedb:\/\/([^:]+):([^@]+)@https?:\/\/([^?]+)\?name=([^&\s]+)/);
  if (!m) return null;
  const hostPort = m[3].replace(/\/$/, "");
  return {
    username: decodeURIComponent(m[1]),
    password: decodeURIComponent(m[2]),
    address: "https://" + hostPort,
    database: decodeURIComponent(m[4]),
  };
}

/** Same rules as product/src/lib/server/config.ts (delimiter split, then legacy regex). */
export function parseTypeDbConnectionString(cs) {
  const trimmed = String(cs).trim();
  const delimited = parseTypeDbConnectionStringDelimited(trimmed);
  if (delimited) return delimited;
  return parseTypeDbConnectionStringLegacy(trimmed);
}

function parseTypeDbConnectionStringDelimited(cs) {
  if (!cs.toLowerCase().startsWith("typedb://")) return null;
  const rest = cs.slice("typedb://".length);
  const httpsIdx = rest.indexOf("@https://");
  const httpIdx = rest.indexOf("@http://");
  let serverPart;
  let credPart;
  if (httpsIdx >= 0) {
    credPart = rest.slice(0, httpsIdx);
    serverPart = rest.slice(httpsIdx + 1);
  } else if (httpIdx >= 0) {
    credPart = rest.slice(0, httpIdx);
    serverPart = rest.slice(httpIdx + 1);
  } else {
    return null;
  }
  const colonIdx = credPart.indexOf(":");
  if (colonIdx < 0) return null;
  const userEnc = credPart.slice(0, colonIdx);
  const passEnc = credPart.slice(colonIdx + 1);
  let username;
  let password;
  try {
    username = decodeURIComponent(userEnc);
    password = decodeURIComponent(passEnc);
  } catch {
    return null;
  }
  const withScheme = /^https?:\/\//i.test(serverPart) ? serverPart : "https://" + serverPart;
  let url;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  const rawName = url.searchParams.get("name");
  if (!rawName) return null;
  let database;
  try {
    database = decodeURIComponent(rawName);
  } catch {
    database = rawName;
  }
  return {
    username,
    password,
    address: "https://" + url.host,
    database,
  };
}

export function escapeTypeqlString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function conceptBinding(row, varName) {
  const base = varName.replace(/^\$/, "");
  const candidates = [base, `$${base}`, varName];
  for (const k of candidates) {
    const c = row[k];
    if (c && typeof c === "object" && "iid" in c) return c;
  }
  return undefined;
}

export function conceptIidFromBinding(row, varName) {
  const c = conceptBinding(row, varName);
  return c?.iid != null ? String(c.iid) : undefined;
}

export function extractInsertedEntityIid(res) {
  if (isApiErrorResponse(res) || res.ok?.answerType !== "conceptRows") return null;
  for (const ans of res.ok.answers ?? []) {
    const row = ans.data;
    if (!row) continue;
    const y = conceptBinding(row, "y");
    if (y?.kind === "entity" && y.iid != null) return String(y.iid);
  }
  return null;
}

export function parseEntityTypeNames(schemaText) {
  const names = [];
  const re = /^entity\s+([^,\s]+)/gm;
  let m;
  while ((m = re.exec(schemaText))) {
    names.push(m[1]);
  }
  return names;
}

/** @returns {{ name: string, role1: string, role2: string }[]} */
export function parseRelationTwoRoles(schemaText) {
  const out = [];
  const re = /relation\s+([^,\s]+),([\s\S]*?)(?=\n(?:entity|relation|attribute)\s|$)/g;
  let m;
  while ((m = re.exec(schemaText)) !== null) {
    const name = m[1];
    const block = m[2];
    const relates = [...block.matchAll(/relates\s+([^,\s]+),?/g)].map((x) => x[1]);
    if (relates.length >= 2) {
      out.push({ name, role1: relates[0], role2: relates[1] });
    }
  }
  return out;
}

export async function runSchemaBlock(driver, database, schemaText) {
  const res = await driver.oneShotQuery(schemaText.trim(), true, database, "schema");
  if (isApiErrorResponse(res)) {
    throw new Error(`Schema apply failed: ${res.err?.message}`);
  }
}

export async function collectAttrs(driver, database, iid) {
  const q = `
match $x iid ${iid}, has $attr $val;
`.trim();
  const res = await driver.oneShotQuery(q, false, database, "read");
  if (isApiErrorResponse(res) || res.ok?.answerType !== "conceptRows") {
    return {};
  }
  /** @type {Record<string, string>} */
  const attrs = {};
  for (const { data: row } of res.ok.answers ?? []) {
    const label = row.attr?.label;
    const val = row.val?.value;
    if (label !== undefined && val !== undefined) {
      attrs[label] = String(val);
    }
  }
  return attrs;
}

export async function recreateTargetDatabase(driver, dbName) {
  const del = await driver.deleteDatabase(dbName);
  if (isApiErrorResponse(del)) {
    const msg = String(del.err?.message ?? "").toLowerCase();
    const okMissing =
      msg.includes("not found") || msg.includes("unknown") || msg.includes("does not exist");
    if (!okMissing) {
      throw new Error(`deleteDatabase: ${del.err?.message}`);
    }
  }
  const cre = await driver.createDatabase(dbName);
  if (isApiErrorResponse(cre)) {
    throw new Error(`createDatabase: ${cre.err?.message}`);
  }
}

export async function findNewEntityIidByAllAttrs(driver, database, newType, attrs, rename) {
  const hasParts = Object.entries(attrs).map(([an, val]) => {
    const newAn = rename.get(an) ?? an;
    return `has ${newAn} "${escapeTypeqlString(val)}"`;
  });
  if (!hasParts.length) return null;
  const q = `
match $y isa! ${newType}, ${hasParts.join(", ")};
`.trim();
  const res = await driver.oneShotQuery(q, false, database, "read");
  if (isApiErrorResponse(res) || res.ok?.answerType !== "conceptRows" || !res.ok.answers?.length) {
    return null;
  }
  if (res.ok.answers.length !== 1) {
    return null;
  }
  const row = res.ok.answers[0].data;
  const y = conceptBinding(row, "y");
  return y?.iid != null ? String(y.iid) : null;
}

export async function copyEntities({ driver, sourceDb, targetDb, rawSchema, rename }) {
  /** @type {Map<string, string>} */
  const iidMap = new Map();
  const entityTypes = parseEntityTypeNames(rawSchema);

  for (const entityType of entityTypes) {
    const newType = rename.get(entityType) ?? entityType;
    let offset = 0;
    const page = 200;
    for (;;) {
      const q = `
match $x isa! ${entityType};
offset ${offset};
limit ${page};
`.trim();
      const res = await driver.oneShotQuery(q, false, sourceDb, "read");
      if (isApiErrorResponse(res)) {
        throw new Error(`List ${entityType}: ${res.err?.message}`);
      }
      const answers = res.ok?.answers ?? [];
      if (!answers.length) break;

      for (const { data: row } of answers) {
        const oldIid = conceptIidFromBinding(row, "x");
        if (!oldIid) continue;
        const attrs = await collectAttrs(driver, sourceDb, oldIid);
        const parts = [`$y isa ${newType}`];
        for (const [an, val] of Object.entries(attrs)) {
          const newAn = rename.get(an) ?? an;
          parts.push(`has ${newAn} "${escapeTypeqlString(val)}"`);
        }
        const insertQ = `insert ${parts.join(", ")};`;
        const ins = await driver.oneShotQuery(insertQ, true, targetDb, "write");
        if (isApiErrorResponse(ins)) {
          throw new Error(`Insert ${entityType} ${oldIid}: ${ins.err?.message}`);
        }

        let newIid = extractInsertedEntityIid(ins)?.trim() ?? null;
        if (!newIid) {
          newIid = await findNewEntityIidByAllAttrs(driver, targetDb, newType, attrs, rename);
        }
        if (!newIid) {
          throw new Error(`Could not resolve new IID for old ${oldIid} (${entityType})`);
        }
        iidMap.set(String(oldIid), String(newIid));
      }
      if (answers.length < page) break;
      offset += page;
    }
    console.log(`Entities done: ${entityType} -> ${newType}`);
  }
  return iidMap;
}

export async function copyRelations({ driver, sourceDb, targetDb, rawSchema, rename, iidMap }) {
  const rels = parseRelationTwoRoles(rawSchema);
  for (const { name: relType, role1, role2 } of rels) {
    const newRel = rename.get(relType) ?? relType;
    let offset = 0;
    const page = 200;
    for (;;) {
      const q = `
match $r isa! ${relType}, links (${role1}: $fromPlayer, ${role2}: $toPlayer);
offset ${offset};
limit ${page};
`.trim();
      const res = await driver.oneShotQuery(q, false, sourceDb, "read");
      if (isApiErrorResponse(res)) {
        console.warn(`Skip relation ${relType}: ${res.err?.message}`);
        break;
      }
      const answers = res.ok?.answers ?? [];
      if (!answers.length) break;

      for (const { data: row } of answers) {
        const oldRid = conceptIidFromBinding(row, "r");
        const fromC = conceptBinding(row, "fromPlayer");
        const toC = conceptBinding(row, "toPlayer");
        const p1 = fromC?.iid != null ? String(fromC.iid) : undefined;
        const p2 = toC?.iid != null ? String(toC.iid) : undefined;
        const srcFromLabel = fromC?.type?.label;
        const srcToLabel = toC?.type?.label;
        if (!oldRid || !p1 || !p2 || !srcFromLabel || !srcToLabel) continue;
        const newFromType = rename.get(srcFromLabel) ?? srcFromLabel;
        const newToType = rename.get(srcToLabel) ?? srcToLabel;
        const n1 = iidMap.get(String(p1));
        const n2 = iidMap.get(String(p2));
        if (!n1 || !n2) {
          console.warn(`Missing IID map for relation ${relType} players ${p1} ${p2}`);
          continue;
        }
        const rattrs = await collectAttrs(driver, sourceDb, oldRid);
        const hasParts = [];
        for (const [an, val] of Object.entries(rattrs)) {
          const newAn = rename.get(an) ?? an;
          hasParts.push(`has ${newAn} "${escapeTypeqlString(val)}"`);
        }
        const hasLines = hasParts.length ? `,\n  ${hasParts.join(",\n  ")}` : "";
        const insertQ = `
match
$a iid ${n1};
$a isa! ${newFromType};
$b iid ${n2};
$b isa! ${newToType};
insert
$z isa ${newRel},
  links (${role1}: $a, ${role2}: $b)${hasLines};
`.trim();
        const ins = await driver.oneShotQuery(insertQ, true, targetDb, "write");
        if (isApiErrorResponse(ins)) {
          throw new Error(`Insert relation ${relType}: ${ins.err?.message}`);
        }
      }
      if (answers.length < page) break;
      offset += page;
    }
    console.log(`Relations done: ${relType} -> ${newRel}`);
  }
}
