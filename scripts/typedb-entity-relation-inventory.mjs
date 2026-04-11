#!/usr/bin/env node
/**
 * Markdown table: leaf entity types (≥1 instance) | count of role-player edges from each instance to any relation.
 * Env: same as `product/src/lib/server/config.ts` and `npm run dump:typedb-schema` (via scripts/lib/typedb-env.mjs).
 *
 * Usage:
 *   node scripts/typedb-entity-relation-inventory.mjs
 *
 * TypeQL per entity type T (read transaction):
 *   match $e isa! T; $r links ($e); reduce $n = count;
 * Total entity instances (cheap):
 *   match $e isa entity; reduce $total = count;
 */
import { TypeDBHttpDriver, isApiErrorResponse, isOkResponse } from "@typedb/driver-http";
import {
  REPO_ROOT,
  getTypeDbConfigFromEnv,
  parseEntityTypeLabelsFromDefine,
} from "./lib/typedb-env.mjs";

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

async function oneShotRead(driver, database, query, options = {}) {
  const res = await driver.oneShotQuery(query.trim(), false, database, "read", {
    transactionTimeoutMillis: 60_000,
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

async function main() {
  const cfg = getTypeDbConfigFromEnv(REPO_ROOT);
  if (!cfg) {
    console.log("| entity name | number of relationships |");
    console.log("| --- | --- |");
    console.log(
      "| _(connection failed — no config)_ | Set `TYPEDB_USERNAME`, `TYPEDB_PASSWORD`, `TYPEDB_ADDRESS` or `TYPEDB_HOST`, `TYPEDB_DATABASE`, or `TYPEDB_CONNECTION_STRING` in `product/.env.local` or repo `.env.local` (see `product/src/lib/server/config.ts`). Then run: `node scripts/typedb-entity-relation-inventory.mjs` |",
    );
    process.exit(0);
  }

  const driver = new TypeDBHttpDriver({
    username: cfg.username,
    password: cfg.password,
    addresses: cfg.addresses,
  });

  const schemaRes = await driver.getDatabaseSchema(cfg.database);
  if (isApiErrorResponse(schemaRes)) {
    console.log("| entity name | number of relationships |");
    console.log("| --- | --- |");
    console.log(
      `| _(connection failed — schema)_ | ${schemaRes.err?.message ?? "getDatabaseSchema failed"}. Retry: \`node scripts/typedb-entity-relation-inventory.mjs\` |`,
    );
    process.exit(0);
  }

  const schemaText = typeof schemaRes.ok === "string" ? schemaRes.ok : "";
  const entityTypes = parseEntityTypeLabelsFromDefine(schemaText);
  if (!entityTypes.length) {
    console.log("| entity name | number of relationships |");
    console.log("| --- | --- |");
    console.log(
      "| _(no entity types in schema export)_ | Check DB and `npm run dump:typedb-schema`. |",
    );
    process.exit(0);
  }

  /** @type {{ type: string, instances: number, edges: number }[]} */
  const rows = [];
  let totalInstances = 0;

  for (const t of entityTypes) {
    const countInstQ = `
match
$e isa! ${t};
reduce $inst = count;
`.trim();
    const cInst = await oneShotRead(driver, cfg.database, countInstQ);
    if ("err" in cInst) {
      rows.push({ type: t, instances: -1, edges: -1, err: cInst.err });
      continue;
    }
    const inst = extractReduceCount(cInst.ok) ?? 0;
    if (inst < 1) {
      continue;
    }
    totalInstances += inst;

    const edgeQ = `
match
$e isa! ${t};
$r links ($e);
reduce $n = count;
`.trim();
    const cEdge = await oneShotRead(driver, cfg.database, edgeQ);
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
  const totalRes = await oneShotRead(driver, cfg.database, totalQ);
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
    console.log(`**Total entity instances** (all types, \`isa entity\`): **${totalFromQuery}**`);
  } else if ("err" in totalRes) {
    console.log("");
    console.log(`_(Total entity count unavailable: ${totalRes.err})_`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
