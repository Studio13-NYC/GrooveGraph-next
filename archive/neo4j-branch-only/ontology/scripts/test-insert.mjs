import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TypeDBHttpDriver, isApiErrorResponse } from "@typedb/driver-http";
import {
  applyTypeDbEnvFromDotenvText,
  getTypeDbConfig,
  readFirstExistingEnvLocal,
} from "../../../../ontology/scripts/lib/typedb-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");
const found = readFirstExistingEnvLocal(repoRoot);
if (!found) {
  console.error("Missing product/.env.local or .env.local");
  process.exit(1);
}
applyTypeDbEnvFromDotenvText(found.text);
const envText = found.text;
const cfg = getTypeDbConfig(envText);
const d = new TypeDBHttpDriver({
  username: cfg.username,
  password: cfg.password,
  addresses: cfg.addresses,
});

const ins = `
insert
$x isa aura-node-album,
  has aura-album-id "probe-insert-1",
  has aura-album-title "Test";
`;

const r = await d.oneShotQuery(ins, true, cfg.database, "write");
if (isApiErrorResponse(r)) console.log(r.err.message);
else console.log("insert ok", r.ok?.answerType);
