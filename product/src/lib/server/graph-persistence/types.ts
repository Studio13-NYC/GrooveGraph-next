import type { ResearchSession } from "@/src/types/research-session";
import type { WorkbenchVizGraph } from "@/src/types/workbench-viz-graph";

export type GraphSyncSkippedRelationship = {
  relationshipId: string;
  reason: string;
};

export type GraphSyncSessionSnapshot = {
  entityCandidates: number;
  relationshipCandidates: number;
  entitiesAccepted: number;
  entitiesDeferred: number;
  entitiesProposed: number;
  entitiesRejected: number;
  relationshipsAccepted: number;
  relationshipsDeferred: number;
  relationshipsProposed: number;
  relationshipsRejected: number;
};

/** Neutral result for API/UI; `database` is the TypeDB database name. */
export type GraphSyncResult = {
  sessionId: string;
  backend: "typedb";
  database: string;
  entitiesUpserted: number;
  relationshipsUpserted: number;
  skippedRelationships: GraphSyncSkippedRelationship[];
  includeDeferred: boolean;
  sessionSnapshot: GraphSyncSessionSnapshot;
  hint?: string;
};

export type GraphPersistence = {
  persistResearchSession(
    session: ResearchSession,
    options?: { includeDeferred?: boolean },
  ): Promise<GraphSyncResult>;
  /** Read-only subgraph for canvas viz (TypeDB entity IIDs as node ids). */
  fetchSessionVizGraph(
    sessionId: string,
    options?: { focusNodeId?: string },
  ): Promise<WorkbenchVizGraph>;
};
