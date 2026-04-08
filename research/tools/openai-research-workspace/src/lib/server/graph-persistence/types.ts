import type { ResearchSession } from "@/src/types/research-session";

export type GraphPersistenceBackendId = "neo4j" | "typedb";

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

/** Neutral result for API/UI; `database` is the target graph database name (Neo4j DB or TypeDB database). */
export type GraphSyncResult = {
  sessionId: string;
  backend: GraphPersistenceBackendId;
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
};
