export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getResearchModel(): string {
  return process.env.OPENAI_RESEARCH_MODEL ?? "gpt-5.4";
}

export function getExtractionModel(): string {
  return process.env.OPENAI_RESEARCH_EXTRACTION_MODEL ?? "gpt-5.4-mini";
}

export type TypeDbConnectionConfig = {
  username: string;
  password: string;
  addresses: string[];
  database: string;
};

/**
 * TypeDB Cloud / CE HTTP driver config. Mirrors ontology/scripts/lib/typedb-env.mjs (env vars only;
 * Next.js loads .env.local into process.env).
 */
export function getTypeDbConfig(): TypeDbConnectionConfig | null {
  // Bracket access so Azure/hosting env vars are read at runtime (Next must not inline these).
  const env = process.env;
  const username = env["TYPEDB_USERNAME"]?.trim();
  const password = env["TYPEDB_PASSWORD"]?.trim();
  const rawAddress = (env["TYPEDB_ADDRESS"] ?? env["TYPEDB_HOST"])?.trim();
  const database = env["TYPEDB_DATABASE"]?.trim();

  if (username && password && rawAddress && database) {
    const addr = rawAddress.includes("://") ? rawAddress : `https://${rawAddress}`;
    return { username, password, addresses: [addr], database };
  }

  const cs = env["TYPEDB_CONNECTION_STRING"]?.trim();
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

/** typedb://user:pass@https://host:port/?name=db */
function parseTypeDbConnectionString(cs: string): {
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
