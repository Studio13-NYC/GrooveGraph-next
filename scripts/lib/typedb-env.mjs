/**
 * TypeDB env resolution aligned with `product/src/lib/server/config.ts` getTypeDbConfig /
 * loadDiskEnvMap: candidate `.env.local` paths (first file wins per key), then process.env.
 * Connection string: delimited `typedb://user:pass@https://host/?name=db` first, legacy regex fallback.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..", "..");

/** @returns {string[]} absolute paths — same order as config.ts envLocalCandidateAbsolutePaths for cwd = repo root */
export function envLocalCandidateAbsolutePaths(cwd = REPO_ROOT) {
  return [
    path.join(cwd, ".env.local"),
    path.join(cwd, "product", ".env.local"),
    path.join(cwd, "..", ".env.local"),
  ];
}

/**
 * Parse line-oriented KEY=value (export optional, quotes stripped). First occurrence of each key wins.
 * @returns {Record<string, string>}
 */
export function loadDiskEnvMap(cwd = REPO_ROOT) {
  const out = {};
  for (const filePath of envLocalCandidateAbsolutePaths(cwd)) {
    if (!fs.existsSync(filePath)) continue;
    let text = fs.readFileSync(filePath, "utf8");
    text = text.replace(/^\uFEFF/, "");
    for (const line of text.split(/\r?\n/)) {
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      if (trimmed.toLowerCase().startsWith("export ")) trimmed = trimmed.slice(7).trim();
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim().replace(/^\uFEFF/, "");
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (out[key] === undefined) {
        out[key] = val;
      }
    }
  }
  return out;
}

function envGet(key, disk) {
  const fromDisk = disk[key];
  if (fromDisk !== undefined && fromDisk !== "") {
    return String(fromDisk).trim();
  }
  const fromProc = process.env[key]?.trim();
  return fromProc === "" ? undefined : fromProc;
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
  const withScheme = /^https?:\/\//i.test(serverPart) ? serverPart : `https://${serverPart}`;
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
    address: url.host,
    database,
  };
}

function parseTypeDbConnectionStringLegacy(cs) {
  const m = cs.match(/typedb:\/\/([^:]+):([^@]+)@https?:\/\/([^?]+)\?name=([^&\s]+)/);
  if (!m) return null;
  const hostPort = m[3].replace(/\/$/, "");
  return {
    username: decodeURIComponent(m[1]),
    password: decodeURIComponent(m[2]),
    address: hostPort,
    database: decodeURIComponent(m[4]),
  };
}

function parseTypeDbConnectionString(cs) {
  const trimmed = cs.trim();
  return parseTypeDbConnectionStringDelimited(trimmed) ?? parseTypeDbConnectionStringLegacy(trimmed);
}

/**
 * @returns {{ username: string, password: string, addresses: string[], database: string } | null}
 */
export function getTypeDbConfigFromEnv(cwd = REPO_ROOT) {
  const disk = loadDiskEnvMap(cwd);
  const username = envGet("TYPEDB_USERNAME", disk);
  const password = envGet("TYPEDB_PASSWORD", disk);
  const rawAddress = envGet("TYPEDB_ADDRESS", disk) ?? envGet("TYPEDB_HOST", disk);
  const database = envGet("TYPEDB_DATABASE", disk);

  if (username && password && rawAddress && database) {
    const addr = rawAddress.includes("://") ? rawAddress : `https://${rawAddress}`;
    return { username, password, addresses: [addr], database };
  }

  const cs = envGet("TYPEDB_CONNECTION_STRING", disk);
  if (cs) {
    const parsed = parseTypeDbConnectionString(cs);
    if (parsed) {
      const addr = parsed.address.includes("://") ? parsed.address : `https://${parsed.address}`;
      return {
        username: parsed.username,
        password: parsed.password,
        addresses: [addr],
        database: parsed.database,
      };
    }
  }

  return null;
}

/**
 * Entity type labels from a TypeQL define block (e.g. getDatabaseSchema / getDatabaseTypeSchema).
 * @param {string} schemaText
 * @returns {string[]}
 */
export function parseEntityTypeLabelsFromDefine(schemaText) {
  const labels = [];
  const re = /(?:^|\n)\s*entity\s+([a-zA-Z0-9_-]+)/gm;
  let m;
  while ((m = re.exec(schemaText)) !== null) {
    labels.push(m[1]);
  }
  return [...new Set(labels)];
}
