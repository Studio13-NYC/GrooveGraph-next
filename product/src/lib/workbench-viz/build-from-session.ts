import type { ResearchSession } from "@/src/types/research-session";
import type { WorkbenchVizEdge, WorkbenchVizGraph, WorkbenchVizNode } from "@/src/types/workbench-viz-graph";

/**
 * Builds a visualization graph from in-memory session candidates (no TypeDB read).
 * Includes every entity candidate and every relationship edge; missing endpoints are still linked by id.
 */
export function buildVizGraphFromSession(session: ResearchSession): WorkbenchVizGraph {
  const nodeById = new Map<string, WorkbenchVizNode>();

  for (const entity of session.entityCandidates) {
    nodeById.set(entity.id, {
      id: entity.id,
      label: entity.displayName.trim() || "Unnamed entity",
      subtitle: entity.provisionalKind,
      reviewStatus: entity.status,
    });
  }

  const edges: WorkbenchVizEdge[] = [];

  for (const rel of session.relationshipCandidates) {
    if (!nodeById.has(rel.sourceEntityId)) {
      nodeById.set(rel.sourceEntityId, {
        id: rel.sourceEntityId,
        label: `Missing entity (${rel.sourceEntityId.slice(0, 8)}…)`,
        subtitle: "unresolved",
        reviewStatus: "proposed",
      });
    }
    if (!nodeById.has(rel.targetEntityId)) {
      nodeById.set(rel.targetEntityId, {
        id: rel.targetEntityId,
        label: `Missing entity (${rel.targetEntityId.slice(0, 8)}…)`,
        subtitle: "unresolved",
        reviewStatus: "proposed",
      });
    }
    edges.push({
      id: rel.id,
      source: rel.sourceEntityId,
      target: rel.targetEntityId,
      label: rel.verb,
      reviewStatus: rel.status,
    });
  }

  return {
    nodes: [...nodeById.values()],
    edges,
  };
}
