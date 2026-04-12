/**
 * Fetch full TypeQL schema from a live TypeDB database (HTTP API: getDatabaseSchema)
 * and write docs/DB-Schema-Export.typeql. Uses the same TYPEDB_* env contract as product/
 * (`product/src/lib/server/config.ts`, `scripts/lib/typedb-env.mjs`).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TypeDBHttpDriver, isApiErrorResponse } from "@typedb/driver-http";
import { getTypeDbConfigFromEnv } from "./lib/typedb-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const cfg = getTypeDbConfigFromEnv(repoRoot);
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

const res = await driver.getDatabaseSchema(cfg.database);
if (isApiErrorResponse(res)) {
  console.error(res.err?.message ?? "getDatabaseSchema failed");
  process.exit(1);
}

const schemaText = typeof res.ok === "string" ? res.ok : "";
const iso = new Date().toISOString().slice(0, 10);
const header = [
  "# TypeDB schema export (full define text) from live database.",
  `# Database: ${cfg.database}`,
  `# Generated: ${iso} (npm run dump:typedb-schema)`,
  "# Source: TypeDB HTTP driver getDatabaseSchema — committed schema in the server, not inferred from instance values.",
  "# Re-run after schema changes; edit in Studio rather than here unless you know the file is the new source of truth.",
  "",
].join("\n");

const outPath = path.join(repoRoot, "docs", "DB-Schema-Export.typeql");
const body = schemaText.trim() ? `${schemaText.trim()}\n` : "# (empty schema response from server)\n";
fs.writeFileSync(outPath, header + body, "utf8");
console.log(`Wrote ${outPath} (${body.length} bytes body)`);
