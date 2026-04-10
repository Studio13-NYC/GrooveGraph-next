/**
 * Copy all data from source TypeDB database to a new database with "aura-" type/attribute
 * prefixes stripped (collision-safe: see scripts/lib/typedb-prefix-rename.mjs).
 *
 * Export/import cannot rename types in the data binary; this script re-inserts entities
 * and relations via the HTTP driver.
 *
 * Prerequisites: product/.env.local with TYPEDB_CONNECTION_STRING pointing at SOURCE database.
 *
 * Usage:
 *   node scripts/migrate-typedb-strip-aura-prefix.mjs
 *
 * Env:
 *   TYPEDB_MIGRATE_TARGET (default: groovegraph-migrate-temp) — empty DB will be created/overwritten
 *   TYPEDB_RAW_SCHEMA    (optional) — path to exported schema file; default: product/.data/typedb-prefix-migration/groovegraph-db.raw.schema.typeql
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TypeDBHttpDriver } from "@typedb/driver-http";
import { buildAuraPrefixRenameMap, applyRenamesToTypeql } from "./lib/typedb-prefix-rename.mjs";
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

const rawPath =
  process.env.TYPEDB_RAW_SCHEMA?.trim() ||
  path.join(repoRoot, "product", ".data", "typedb-prefix-migration", "groovegraph-db.raw.schema.typeql");

const targetDb = process.env.TYPEDB_MIGRATE_TARGET?.trim() || "groovegraph-migrate-temp";

const conn = getConn();
const rawSchema = fs.readFileSync(rawPath, "utf8");
const rename = buildAuraPrefixRenameMap(rawSchema);
const strippedSchema = applyRenamesToTypeql(rawSchema, rename);
const driver = new TypeDBHttpDriver({
  username: conn.username,
  password: conn.password,
  addresses: [conn.address],
});

console.log(`Source database: ${conn.database}`);
console.log(`Target database: ${targetDb} (will be recreated)`);

await recreateTargetDatabase(driver, targetDb);

await runSchemaBlock(driver, targetDb, strippedSchema);

const iidMap = await copyEntities({
  driver,
  sourceDb: conn.database,
  targetDb,
  rawSchema,
  rename,
});

await copyRelations({
  driver,
  sourceDb: conn.database,
  targetDb,
  rawSchema,
  rename,
  iidMap,
});

console.log("Migration copy complete.");
console.log(
  `Next: node scripts/typedb-promote-migrate-temp.mjs (or export/import in Console), then npm run dump:typedb-schema`,
);
