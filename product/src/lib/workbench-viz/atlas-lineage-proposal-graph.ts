import {
  provisionalKindToFamily,
  type KindFamily,
} from "@/src/lib/workbench-viz/graph-viz-styles";
import { ATLAS_SESSION_PHASES } from "@/src/lib/workbench-viz/workbench-viz-to-atlas-lineage";
import type { AtlasDemoEdge, AtlasDemoGraph, AtlasDemoNode } from "@/src/types/atlas-lineage";
import type { ResearchSession } from "@/src/types/research-session";

/** Same lane banding as {@link workbenchVizToAtlasLineageGraph}. */
const LANE_BY_FAMILY: Record<KindFamily, number> = {
  people: 0,
  labels: 0,
  studios: 1,
  recordings: 1,
  genres: 2,
  gear: 2,
  other: 1,
};

/**
 * Atlas-lineage DTOs for **proposed** entity/relationship candidates on a research session
 * (preview graph before acceptance).
 */
export function researchSessionProposalsToAtlasGraph(session: ResearchSession): AtlasDemoGraph {
  const proposedEntities = session.entityCandidates.filter((e) => e.status === "proposed");
  const proposedIds = new Set(proposedEntities.map((e) => e.id));

  const nodes: AtlasDemoNode[] = proposedEntities.map((entity) => {
    const family = provisionalKindToFamily(entity.provisionalKind);
    return {
      id: `cand:${entity.id}`,
      label: entity.displayName,
      kind: family,
      lane: LANE_BY_FAMILY[family],
      pending: true,
      essential: false,
    };
  });

  const edges: AtlasDemoEdge[] = [];
  for (const rel of session.relationshipCandidates) {
    if (rel.status !== "proposed") {
      continue;
    }
    if (!proposedIds.has(rel.sourceEntityId) || !proposedIds.has(rel.targetEntityId)) {
      continue;
    }
    edges.push({
      id: `candrel:${rel.id}`,
      source: `cand:${rel.sourceEntityId}`,
      target: `cand:${rel.targetEntityId}`,
      verb: rel.verb,
      pending: true,
    });
  }

  return {
    phases: ATLAS_SESSION_PHASES,
    nodes,
    edges,
  };
}

export function sessionHasProposedGraphCandidates(session: ResearchSession): boolean {
  return (
    session.entityCandidates.some((e) => e.status === "proposed") ||
    session.relationshipCandidates.some((r) => r.status === "proposed")
  );
}

/**
 * Union of TypeDB/session viz nodes with proposed-candidate overlay (`cand:*` ids).
 * Base graph order is preserved; overlay adds or replaces by id.
 */
export function mergeAtlasLineageWithProposals(
  baseFromViz: AtlasDemoGraph,
  session: ResearchSession,
): AtlasDemoGraph {
  if (!sessionHasProposedGraphCandidates(session)) {
    return baseFromViz;
  }

  const overlay = researchSessionProposalsToAtlasGraph(session);
  const nodeById = new Map<string, AtlasDemoNode>();
  const nodeOrder: string[] = [];

  for (const n of baseFromViz.nodes) {
    nodeById.set(n.id, n);
    nodeOrder.push(n.id);
  }
  for (const n of overlay.nodes) {
    if (!nodeById.has(n.id)) {
      nodeOrder.push(n.id);
    }
    nodeById.set(n.id, n);
  }

  const edgeById = new Map<string, AtlasDemoEdge>();
  const edgeOrder: string[] = [];
  for (const e of baseFromViz.edges) {
    edgeById.set(e.id, e);
    edgeOrder.push(e.id);
  }
  for (const e of overlay.edges) {
    if (!edgeById.has(e.id)) {
      edgeOrder.push(e.id);
    }
    edgeById.set(e.id, e);
  }

  const phases =
    baseFromViz.phases.length > 0 ? baseFromViz.phases : overlay.phases.length > 0 ? overlay.phases : ATLAS_SESSION_PHASES;

  return {
    phases,
    nodes: nodeOrder.map((id) => nodeById.get(id)!),
    edges: edgeOrder.map((id) => edgeById.get(id)!),
  };
}
