import { createTypeDbGraphPersistence } from "@/src/lib/server/typedb-graph-persistence";
import type { GraphPersistence } from "./types";

let cached: GraphPersistence | null = null;

/**
 * Returns the TypeDB graph persistence implementation (singleton per process).
 */
export function getGraphPersistence(): GraphPersistence {
  if (!cached) {
    cached = createTypeDbGraphPersistence();
  }
  return cached;
}
