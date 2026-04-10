/**
 * Replace the live app database (name from TYPEDB_CONNECTION_STRING ?name=) with a full
 * logical copy of groovegraph-migrate-temp (same schema + data). Destructive: deletes the
 * target database first.
 *
 * Prerequisites:
 *   - product/.env.local with TYPEDB_CONNECTION_STRING; ?name= must be the DB to replace (e.g. groovegraph-db)
 *   - groovegraph-migrate-temp populated (e.g. after migrate-typedb-strip-aura-prefix.mjs)
 *
 * Usage:
 *   node scripts/typedb-promote-migrate-temp.mjs
 *
 * Env:
 *   TYPEDB_PROMOTE_SOURCE (default: groovegraph-migrate-temp)
 */
import path from "path";
import { fileURLToPath } from "url";
import { TypeDBHttpDriver, isApiErrorResponse } from "@typedb/driver-http";
import {
  applyDotenvFile,
  parseTypeDbConnectionString,
  recreateTargetDatabase,
  runSchemaBlock,
  copyEntities,
  copyRelations,
} from "./lib/typedb-database-copy.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function getConn() {
  applyDotenvFile(path.join(repoRoot, "product", ".env.local"));
  const cs = process.env.TYPEDB_CONNECTION_STRING?.trim();
  if (!cs) throw new Error("TYPEDB_CONNECTION_STRING missing");
  const p = parseTypeDbConnectionString(cs);
  if (!p) throw new Error("Could not parse TYPEDB_CONNECTION_STRING");
  return p;
}

const sourceDb = process.env.TYPEDB_PROMOTE_SOURCE?.trim() || "groovegraph-migrate-temp";
const conn = getConn();
const targetDb = conn.database;

const driver = new TypeDBHttpDriver({
  username: conn.username,
  password: conn.password,
  addresses: [conn.address],
});

console.log(`Source (read): ${sourceDb}`);
console.log(`Target (recreated): ${targetDb}`);

const schemaRes = await driver.getDatabaseSchema(sourceDb);
if (isApiErrorResponse(schemaRes)) {
  throw new Error(`getDatabaseSchema(${sourceDb}): ${schemaRes.err?.message}`);
}
const schemaText = typeof schemaRes.ok === "string" ? schemaRes.ok : "";
if (!schemaText.trim()) {
  throw new Error(`Empty schema from ${sourceDb}; ensure migration completed.`);
}

await recreateTargetDatabase(driver, targetDb);
await runSchemaBlock(driver, targetDb, schemaText);

/** @type {Map<string, string>} */
const rename = new Map();
const iidMap = await copyEntities({
  driver,
  sourceDb,
  targetDb,
  rawSchema: schemaText,
  rename,
});
await copyRelations({
  driver,
  sourceDb,
  targetDb,
  rawSchema: schemaText,
  rename,
  iidMap,
});

console.log("Promote complete. Run: npm run dump:typedb-schema");
console.log(`Optional: delete ${sourceDb} in Console if you no longer need the temp DB.`);
