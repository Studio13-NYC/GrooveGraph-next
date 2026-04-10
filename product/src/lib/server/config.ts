import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

let diskEnvCache: Record<string, string> | null = null;

function envLocalCandidateAbsolutePaths(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, ".env.local"),
    path.join(cwd, "product", ".env.local"),
    path.join(cwd, "..", ".env.local"),
  ];
}

/**
 * Parse `product/.env.local` (and monorepo fallbacks) once. Kept in a plain object so TypeDB
 * keys remain readable even when Next's `process.env` proxy does not accept runtime assignments.
 * Same line parser as `scripts/lib/typedb-database-copy.mjs`.
 */
function loadDiskEnvMap(): Record<string, string> {
  if (diskEnvCache) {
    return diskEnvCache;
  }
  const out: Record<string, string> = {};
  for (const filePath of envLocalCandidateAbsolutePaths()) {
    if (!existsSync(filePath)) {
      continue;
    }
    let text = readFileSync(filePath, "utf8");
    text = text.replace(/^\uFEFF/, "");
    for (const line of text.split(/\r?\n/)) {
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      if (trimmed.toLowerCase().startsWith("export ")) {
        trimmed = trimmed.slice(7).trim();
      }
      const eq = trimmed.indexOf("=");
      if (eq === -1) {
        continue;
      }
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
  diskEnvCache = out;
  return out;
}

function envGet(key: string): string | undefined {
  const fromDisk = loadDiskEnvMap()[key];
  if (fromDisk !== undefined && fromDisk !== "") {
    return fromDisk.trim();
  }
  const fromProc = process.env[key]?.trim();
  return fromProc === "" ? undefined : fromProc;
}

export function getResearchModel(): string {
  return process.env.OPENAI_RESEARCH_MODEL ?? "gpt-5.4";
}

export function getExtractionModel(): string {
  return process.env.OPENAI_RESEARCH_EXTRACTION_MODEL ?? "gpt-5.4-mini";
}

type TypeDbConnectionConfig = {
  username: string;
  password: string;
  addresses: string[];
  database: string;
};

/**
 * TypeDB Cloud / CE HTTP driver config. Same env vars as scripts/dump-typedb-schema.mjs (env vars only;
 * Next.js loads .env.local into process.env).
 */
export function getTypeDbConfig(): TypeDbConnectionConfig | null {
  loadDiskEnvMap();
  const username = envGet("TYPEDB_USERNAME");
  const password = envGet("TYPEDB_PASSWORD");
  const rawAddress = envGet("TYPEDB_ADDRESS") ?? envGet("TYPEDB_HOST");
  const database = envGet("TYPEDB_DATABASE");

  if (username && password && rawAddress && database) {
    const addr = rawAddress.includes("://") ? rawAddress : `https://${rawAddress}`;
    return { username, password, addresses: [addr], database };
  }

  const cs = envGet("TYPEDB_CONNECTION_STRING");
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

/** True when `.env.local` defines `TYPEDB_CONNECTION_STRING` with no non-whitespace value. */
export function isTypedbConnectionStringEmptyInDisk(): boolean {
  const disk = loadDiskEnvMap();
  return (
    disk["TYPEDB_CONNECTION_STRING"] !== undefined && !String(disk["TYPEDB_CONNECTION_STRING"]).trim()
  );
}

/**
 * Parse `typedb://user:pass@https://host:port/?name=db` (and `http://`).
 * Splits at `@https://` / `@http://` so passwords may contain `@` (not only when encoded),
 * and supports `:` in the password (split only the first `:` before the host delimiter).
 */
function parseTypeDbConnectionString(cs: string): {
  username: string;
  password: string;
  address: string;
  database: string;
} | null {
  const trimmed = cs.trim();
  const modern = parseTypeDbConnectionStringDelimited(trimmed);
  if (modern) {
    return modern;
  }
  return parseTypeDbConnectionStringLegacy(trimmed);
}

function parseTypeDbConnectionStringDelimited(cs: string): {
  username: string;
  password: string;
  address: string;
  database: string;
} | null {
  if (!cs.toLowerCase().startsWith("typedb://")) {
    return null;
  }
  const rest = cs.slice("typedb://".length);
  const httpsIdx = rest.indexOf("@https://");
  const httpIdx = rest.indexOf("@http://");
  let serverPart: string;
  let credPart: string;
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
  if (colonIdx < 0) {
    return null;
  }
  const userEnc = credPart.slice(0, colonIdx);
  const passEnc = credPart.slice(colonIdx + 1);
  let username: string;
  let password: string;
  try {
    username = decodeURIComponent(userEnc);
    password = decodeURIComponent(passEnc);
  } catch {
    return null;
  }
  const withScheme = /^https?:\/\//i.test(serverPart) ? serverPart : `https://${serverPart}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  const rawName = url.searchParams.get("name");
  if (!rawName) {
    return null;
  }
  let database: string;
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

/** Original strict regex (fallback). */
function parseTypeDbConnectionStringLegacy(cs: string): {
  username: string;
  password: string;
  address: string;
  database: string;
} | null {
  const m = cs.match(/typedb:\/\/([^:]+):([^@]+)@https?:\/\/([^?]+)\?name=([^&\s]+)/);
  if (!m) {
    return null;
  }
  const hostPort = m[3].replace(/\/$/, "");
  return {
    username: decodeURIComponent(m[1]),
    password: decodeURIComponent(m[2]),
    address: hostPort,
    database: decodeURIComponent(m[4]),
  };
}
