#!/usr/bin/env node
/**
 * Markdown inventory of TypeDB entity data (read-only).
 * Env: same as `product/src/lib/server/config.ts` (via scripts/lib/typedb-env.mjs).
 *
 * Usage:
 *   node scripts/typedb-entity-relation-inventory.mjs
 *   node scripts/typedb-entity-relation-inventory.mjs --per-instance
 *   node scripts/typedb-entity-relation-inventory.mjs --per-instance --max-per-type=2000
 *
 * Default: one row per **leaf entity type** with ≥1 instance; **number of relationships** =
 * total `links` role-player edges from all instances of that type.
 *
 * `--per-instance`: one row per **entity instance** (iid); **number of relationships** =
 * count of `$r links ($e)` for that instance (0 if isolated).
 */
import { TypeDBHttpDriver, isApiErrorResponse, isOkResponse } from "@typedb/driver-http";
import {
  REPO_ROOT,
  getTypeDbConfigFromEnv,
  parseEntityTypeLabelsFromDefine,
} from "./lib/typedb-env.mjs";

function parseArgs(argv) {
  const perInstance =
    argv.includes("--per-instance") || argv.includes("--instances");
  let maxPerType = 5000;
  for (const a of argv) {
    const m = /^--max-per-type=(\d+)$/.exec(a);
    if (m) {
      maxPerType = Math.max(1, parseInt(m[1], 10));
    }
  }
  return { perInstance, maxPerType };
}

function extractReduceCount(response) {
  if (response.answerType !== "conceptRows" || !response.answers?.length) {
    return null;
  }
  const row = response.answers[0].data;
  for (const c of Object.values(row)) {
    if (c?.kind === "value" && c.value != null) {
      const n = Number(c.value);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

/** @param {import("@typedb/driver-http").Concept} c */
function entityIid(c) {
  if (c?.kind === "entity" && typeof c.iid === "string") {
    return c.iid;
  }
  return null;
}

/** Pull numeric reduce output from a grouped row (variable name varies). */
function extractGroupedCount(row) {
  for (const c of Object.values(row)) {
    if (c?.kind === "value" && c.value != null) {
      const n = Number(c.value);
      if (Number.isFinite(n)) {
        return n;
      }
    }
  }
  return null;
}

async function oneShotRead(driver, database, query, options = {}) {
  const res = await driver.oneShotQuery(query.trim(), false, database, "read", {
    transactionTimeoutMillis: 120_000,
    ...options,
  });
  if (isApiErrorResponse(res)) {
    return { err: res.err?.message ?? String(res.err) };
  }
  if (!isOkResponse(res)) {
    return { err: "empty response" };
  }
  return { ok: res.ok };
}

async function runAggregateByType(driver, database, entityTypes) {
  /** @type {{ type: string, instances: number, edges: number, err?: string }[]} */
  const rows = [];

  for (const t of entityTypes) {
    const countInstQ = `
match
$e isa! ${t};
reduce $inst = count;
`.trim();
    const cInst = await oneShotRead(driver, database, countInstQ);
    if ("err" in cInst) {
      rows.push({ type: t, instances: -1, edges: -1, err: cInst.err });
      continue;
    }
    const inst = extractReduceCount(cInst.ok) ?? 0;
    if (inst < 1) {
      continue;
    }

    const edgeQ = `
match
$e isa! ${t};
$r links ($e);
reduce $n = count;
`.trim();
    const cEdge = await oneShotRead(driver, database, edgeQ);
    if ("err" in cEdge) {
      rows.push({ type: t, instances: inst, edges: -1, err: cEdge.err });
      continue;
    }
    const edges = extractReduceCount(cEdge.ok) ?? 0;
    rows.push({ type: t, instances: inst, edges });
  }

  const totalQ = `
match
$e isa entity;
reduce $total = count;
`.trim();
  const totalRes = await oneShotRead(driver, database, totalQ);
  const totalFromQuery =
    "ok" in totalRes ? extractReduceCount(totalRes.ok) : null;

  console.log("| entity name | number of relationships |");
  console.log("| --- | --- |");
  if (!rows.length) {
    console.log(
      "| _(no entity instances)_ | All leaf entity types have zero instances, or instance counts failed. |",
    );
  } else {
    for (const r of rows.sort((a, b) => a.type.localeCompare(b.type))) {
      if (r.edges < 0) {
        console.log(
          `| \`${r.type}\` | _(error: ${String(r.err).replace(/\|/g, "\\|")})_ |`,
        );
      } else {
        console.log(`| \`${r.type}\` | ${r.edges} |`);
      }
    }
  }

  if ("ok" in totalRes && totalFromQuery != null) {
    console.log("");
    console.log(
      `**Total entity instances** (all types, \`isa entity\`): **${totalFromQuery}**`,
    );
  } else if ("err" in totalRes) {
    console.log("");
    console.log(`_(Total entity count unavailable: ${totalRes.err})_`);
  }
}

/**
 * @param {import("@typedb/driver-http").QueryResponse} response
 */
function collectIidsFromMatch(response) {
  const out = [];
  if (response.answerType !== "conceptRows" || !response.answers?.length) {
    return out;
  }
  for (const { data: row } of response.answers) {
    for (const c of Object.values(row)) {
      const iid = entityIid(c);
      if (iid) {
        out.push(iid);
        break;
      }
    }
  }
  return out;
}

/**
 * @param {import("@typedb/driver-http").QueryResponse} response
 */
function collectGroupbyEntityCounts(response) {
  /** @type {Map<string, number>} */
  const map = new Map();
  if (response.answerType !== "conceptRows" || !response.answers?.length) {
    return map;
  }
  for (const { data: row } of response.answers) {
    let iid = null;
    for (const c of Object.values(row)) {
      const id = entityIid(c);
      if (id) {
        iid = id;
        break;
      }
    }
    if (!iid) {
      continue;
    }
    const n = extractGroupedCount(row);
    if (n != null) {
      map.set(iid, n);
    }
  }
  return map;
}

async function runPerInstance(driver, database, entityTypes, maxPerType) {
  /** @type {{ type: string, iid: string, n: number }[]} */
  const allRows = [];

  for (const t of entityTypes) {
    const countInstQ = `
match
$e isa! ${t};
reduce $inst = count;
`.trim();
    const cInst = await oneShotRead(driver, database, countInstQ);
    if ("err" in cInst) {
      console.error(`_(type \`${t}\`: instance count failed: ${cInst.err})_`);
      continue;
    }
    const inst = extractReduceCount(cInst.ok) ?? 0;
    if (inst < 1) {
      continue;
    }

    if (inst > maxPerType) {
      console.error(
        `Skipping per-instance listing for \`${t}\`: ${inst} instances > --max-per-type=${maxPerType}. Raise the limit or use default (aggregate) mode.`,
      );
      continue;
    }

    const listQ = `
match
$e isa! ${t};
`.trim();
    const listRes = await oneShotRead(driver, database, listQ);
    if ("err" in listRes) {
      console.error(`_(type \`${t}\`: list instances failed: ${listRes.err})_`);
      continue;
    }
    const iids = collectIidsFromMatch(listRes.ok);
    if (iids.length !== inst) {
      console.error(
        `Warning: type \`${t}\`: reduce count=${inst} but match returned ${iids.length} rows; using match rows.`,
      );
    }

    const groupQ = `
match
$e isa! ${t};
$r links ($e);
reduce $rel_n = count groupby $e;
`.trim();
    const gRes = await oneShotRead(driver, database, groupQ);
    /** @type {Map<string, number>} */
    let byIid = new Map();
    if ("err" in gRes) {
      console.error(
        `_(type \`${t}\`: groupby links failed: ${gRes.err}; assuming 0 links per instance)_`,
      );
    } else {
      byIid = collectGroupbyEntityCounts(gRes.ok);
    }

    for (const iid of iids.sort()) {
      allRows.push({
        type: t,
        iid,
        n: byIid.get(iid) ?? 0,
      });
    }
  }

  console.log("| entity type | instance iid | number of relationships |");
  console.log("| --- | --- | --- |");
  if (!allRows.length) {
    console.log(
      "| _(no rows)_ | — | No instances listed (empty DB, skipped types, or errors above). |",
    );
    return;
  }
  for (const r of allRows.sort((a, b) =>
    a.type === b.type ? a.iid.localeCompare(b.iid) : a.type.localeCompare(b.type),
  )) {
    const safeIid = r.iid.replace(/\|/g, "\\|");
    console.log(`| \`${r.type}\` | \`${safeIid}\` | ${r.n} |`);
  }

  const totalQ = `
match
$e isa entity;
reduce $total = count;
`.trim();
  const totalRes = await oneShotRead(driver, database, totalQ);
  const totalFromQuery =
    "ok" in totalRes ? extractReduceCount(totalRes.ok) : null;
  if ("ok" in totalRes && totalFromQuery != null) {
    console.log("");
    console.log(
      `**Total entity instances** (all types, \`isa entity\`): **${totalFromQuery}**`,
    );
  }
}

async function main() {
  const { perInstance, maxPerType } = parseArgs(process.argv.slice(2));

  const cfg = getTypeDbConfigFromEnv(REPO_ROOT);
  if (!cfg) {
    if (perInstance) {
      console.log("| entity type | instance iid | number of relationships |");
      console.log("| --- | --- | --- |");
      console.log(
        "| _(connection failed — no config)_ | — | Set `TYPEDB_*` in `product/.env.local` or repo `.env.local` (see `product/src/lib/server/config.ts`). Then: `node scripts/typedb-entity-relation-inventory.mjs --per-instance` |",
      );
    } else {
      console.log("| entity name | number of relationships |");
      console.log("| --- | --- |");
      console.log(
        "| _(connection failed — no config)_ | Set `TYPEDB_USERNAME`, `TYPEDB_PASSWORD`, `TYPEDB_ADDRESS` or `TYPEDB_HOST`, `TYPEDB_DATABASE`, or `TYPEDB_CONNECTION_STRING` in `product/.env.local` or repo `.env.local` (see `product/src/lib/server/config.ts`). Then run: `node scripts/typedb-entity-relation-inventory.mjs` |",
      );
    }
    process.exit(0);
  }

  const driver = new TypeDBHttpDriver({
    username: cfg.username,
    password: cfg.password,
    addresses: cfg.addresses,
  });

  const schemaRes = await driver.getDatabaseSchema(cfg.database);
  if (isApiErrorResponse(schemaRes)) {
    const msg = schemaRes.err?.message ?? "getDatabaseSchema failed";
    if (perInstance) {
      console.log("| entity type | instance iid | number of relationships |");
      console.log("| --- | --- | --- |");
      console.log(
        `| _(connection failed — schema)_ | — | ${msg}. Retry with env set. |`,
      );
    } else {
      console.log("| entity name | number of relationships |");
      console.log("| --- | --- |");
      console.log(
        `| _(connection failed — schema)_ | ${msg}. Retry: \`node scripts/typedb-entity-relation-inventory.mjs\` |`,
      );
    }
    process.exit(0);
  }

  const schemaText = typeof schemaRes.ok === "string" ? schemaRes.ok : "";
  const entityTypes = parseEntityTypeLabelsFromDefine(schemaText);
  if (!entityTypes.length) {
    if (perInstance) {
      console.log("| entity type | instance iid | number of relationships |");
      console.log("| --- | --- | --- |");
      console.log(
        "| _(no entity types in schema export)_ | — | Check DB and `npm run dump:typedb-schema`. |",
      );
    } else {
      console.log("| entity name | number of relationships |");
      console.log("| --- | --- |");
      console.log(
        "| _(no entity types in schema export)_ | Check DB and `npm run dump:typedb-schema`. |",
      );
    }
    process.exit(0);
  }

  if (perInstance) {
    await runPerInstance(driver, cfg.database, entityTypes, maxPerType);
  } else {
    await runAggregateByType(driver, cfg.database, entityTypes);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
