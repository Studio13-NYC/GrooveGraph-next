import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TypeDBHttpDriver, isApiErrorResponse } from "@typedb/driver-http";
import { applyTypeDbEnvFromDotenvText, getTypeDbConfig } from "./lib/typedb-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const envPath = resolve(repoRoot, ".env.local");

const envText = readFileSync(envPath, "utf8");
applyTypeDbEnvFromDotenvText(envText);

const cfg = getTypeDbConfig(envText);
if (!cfg) {
  console.error(
    "Missing TypeDB config. Set TYPEDB_USERNAME, TYPEDB_PASSWORD, TYPEDB_ADDRESS (host:port), TYPEDB_DATABASE or TYPEDB_CONNECTION_STRING=typedb://user:pass@https://host:port/?name=db",
  );
  process.exit(1);
}

const driver = new TypeDBHttpDriver({
  username: cfg.username,
  password: cfg.password,
  addresses: cfg.addresses,
});

const health = await driver.health();
if (isApiErrorResponse(health)) {
  console.error("health failed", health.err);
  process.exit(1);
}
console.log("TypeDB health OK");

const ver = await driver.version();
console.log("version", isApiErrorResponse(ver) ? ver.err : ver.ok);

const dbs = await driver.getDatabases();
if (isApiErrorResponse(dbs)) {
  console.error("list db failed", dbs.err);
  process.exit(1);
}
console.log("databases:", dbs.ok?.databases?.map((d) => d.name).join(", "));
