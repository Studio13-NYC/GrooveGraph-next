import neo4j, { type Driver } from "neo4j-driver";
import { getNeo4jConfig } from "@/src/lib/server/config";

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver | null {
  const config = getNeo4jConfig();
  if (!config) {
    return null;
  }

  if (!driver) {
    driver = neo4j.driver(config.uri, neo4j.auth.basic(config.username, config.password));
  }

  return driver;
}

export async function verifyNeo4jConnectivity(): Promise<void> {
  const d = getNeo4jDriver();
  if (!d) {
    throw new Error("Neo4j is not configured (set NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD).");
  }

  await d.verifyConnectivity();
}
