import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TypeDBHttpDriver } from "@typedb/driver-http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
function applyDotenvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}
applyDotenvFile(path.join(repoRoot, "product", ".env.local"));
const cs = process.env.TYPEDB_CONNECTION_STRING.trim();
const m = cs.match(/typedb:\/\/([^:]+):([^@]+)@https?:\/\/([^?]+)\?name=([^&\s]+)/);
const cfg = {
  username: decodeURIComponent(m[1]),
  password: decodeURIComponent(m[2]),
  addresses: ["https://" + m[3].replace(/\/$/, "")],
  database: decodeURIComponent(m[4]),
};
const driver = new TypeDBHttpDriver({
  username: cfg.username,
  password: cfg.password,
  addresses: cfg.addresses,
});
const q1 = `
match $r isa! graph-relationship;
limit 1;
`.trim();
const r1 = await driver.oneShotQuery(q1, false, cfg.database, "read");
const rid = r1.ok?.answers?.[0]?.data?.r?.iid;
if (!rid) {
  console.log("no graph-relationship", JSON.stringify(r1).slice(0, 500));
  process.exit(0);
}
console.log("rid", rid);
const q2 = `
match $r iid ${rid}, links (source-entity: $src, target-entity: $tgt);
`.trim();
const r2 = await driver.oneShotQuery(q2, false, cfg.database, "read");
console.log(JSON.stringify(r2, null, 2).slice(0, 4000));
