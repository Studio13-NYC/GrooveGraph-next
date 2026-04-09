import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TypeDBHttpDriver, isApiErrorResponse } from "@typedb/driver-http";
import {
  applyTypeDbEnvFromDotenvText,
  getTypeDbConfig,
  readFirstExistingEnvLocal,
} from "./lib/typedb-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const found = readFirstExistingEnvLocal(repoRoot);
if (!found) {
  console.error("Missing product/.env.local or .env.local");
  process.exit(1);
}
applyTypeDbEnvFromDotenvText(found.text);
const envText = found.text;
const cfg = getTypeDbConfig(envText);
const driver = new TypeDBHttpDriver({
  username: cfg.username,
  password: cfg.password,
  addresses: cfg.addresses,
});

const db = cfg.database;
const create = await driver.createDatabase(db);
if (isApiErrorResponse(create) && !String(create.err?.message ?? "").toLowerCase().includes("exist")) {
  console.error("createDatabase", create.err);
  process.exit(1);
}

async function tryQ(label, q) {
  const res = await driver.oneShotQuery(q, true, db, "schema");
  const err = isApiErrorResponse(res) ? res.err : null;
  console.log(label, "=>", err ? `${err.code}: ${err.message}` : "ok");
}

await tryQ(
  "entity sub super",
  `
define entity graph-entity;
define entity artist-entity sub graph-entity;
`,
);

await tryQ(
  "relation + plays",
  `
define relation session-includes-entity, relates container-session, relates member-entity;
define entity research-session;
define entity graph-entity2;
define research-session plays session-includes-entity:container-session;
define graph-entity2 plays session-includes-entity:member-entity;
`,
);
