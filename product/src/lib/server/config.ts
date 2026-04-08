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

export type Neo4jConnectionConfig = {
  uri: string;
  username: string;
  password: string;
  database: string;
};

/**
 * Neo4j Aura / self-hosted connection. All four values are required when persistence is enabled.
 * Supports NEO4J_USERNAME (preferred) or NEO4J_USER for compatibility.
 */
export function getNeo4jConfig(): Neo4jConnectionConfig | null {
  const uri = process.env.NEO4J_URI?.trim();
  const username = (process.env.NEO4J_USERNAME ?? process.env.NEO4J_USER)?.trim();
  const password = process.env.NEO4J_PASSWORD?.trim();
  const database = process.env.NEO4J_DATABASE?.trim() || "neo4j";

  if (!uri || !username || !password) {
    return null;
  }

  return { uri, username, password, database };
}

export type GraphPersistenceBackend = "neo4j" | "typedb";

export function getGraphPersistenceBackend(): GraphPersistenceBackend {
  const v = process.env.GRAPH_PERSISTENCE_BACKEND?.trim().toLowerCase();
  if (v === "typedb") {
    return "typedb";
  }
  return "neo4j";
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
  const username = process.env.TYPEDB_USERNAME?.trim();
  const password = process.env.TYPEDB_PASSWORD?.trim();
  const rawAddress = (process.env.TYPEDB_ADDRESS ?? process.env.TYPEDB_HOST)?.trim();
  const database = process.env.TYPEDB_DATABASE?.trim();

  if (username && password && rawAddress && database) {
    const addr = rawAddress.includes("://") ? rawAddress : `https://${rawAddress}`;
    return { username, password, addresses: [addr], database };
  }

  const cs = process.env.TYPEDB_CONNECTION_STRING?.trim();
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
