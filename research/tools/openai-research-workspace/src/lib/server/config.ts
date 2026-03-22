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
