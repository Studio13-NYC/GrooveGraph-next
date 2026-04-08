import { getGraphPersistenceBackend } from "@/src/lib/server/config";
import { createNeo4jGraphPersistence } from "@/src/lib/server/neo4j-graph-persistence";
import { createTypeDbGraphPersistence } from "@/src/lib/server/typedb-graph-persistence";
import type { GraphPersistence } from "./types";

let cached: GraphPersistence | null = null;
let cachedBackend: ReturnType<typeof getGraphPersistenceBackend> | null = null;

/**
 * Resolves the graph persistence implementation from GRAPH_PERSISTENCE_BACKEND (default neo4j).
 * Cached per process for stable driver reuse when the backend env does not change.
 */
export function getGraphPersistence(): GraphPersistence {
  const backend = getGraphPersistenceBackend();
  if (cached && cachedBackend === backend) {
    return cached;
  }
  cachedBackend = backend;
  cached = backend === "typedb" ? createTypeDbGraphPersistence() : createNeo4jGraphPersistence();
  return cached;
}
