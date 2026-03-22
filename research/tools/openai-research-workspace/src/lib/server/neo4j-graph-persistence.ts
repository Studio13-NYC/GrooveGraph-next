import neo4j, { type ManagedTransaction } from "neo4j-driver";
import { getNeo4jConfig } from "@/src/lib/server/config";
import { getNeo4jDriver } from "@/src/lib/server/neo4j-driver";
import type {
  EntityCandidate,
  RelationshipCandidate,
  ResearchSession,
} from "@/src/types/research-session";

export type Neo4jSyncSkippedRelationship = {
  relationshipId: string;
  reason: string;
};

export type Neo4jSyncSessionSnapshot = {
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

export type Neo4jSyncResult = {
  sessionId: string;
  database: string;
  entitiesUpserted: number;
  relationshipsUpserted: number;
  skippedRelationships: Neo4jSyncSkippedRelationship[];
  includeDeferred: boolean;
  sessionSnapshot: Neo4jSyncSessionSnapshot;
  /** Non-empty when nothing was written but the session has candidates, or to suggest Browser queries */
  hint?: string;
};

function normalizeName(displayName: string): string {
  return displayName.trim().toLowerCase();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function mergeStringLists(existing: unknown, incoming: string[]): string[] {
  const base = Array.isArray(existing) ? existing.filter((item): item is string => typeof item === "string") : [];
  return uniqueStrings([...base, ...incoming]);
}

function mergeAttributes(
  existingJson: unknown,
  incoming: Record<string, string>,
): Record<string, string> {
  let base: Record<string, string> = {};
  if (typeof existingJson === "string" && existingJson.trim()) {
    try {
      const parsed = JSON.parse(existingJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof key === "string" && typeof value === "string") {
            base[key] = value;
          }
        }
      }
    } catch {
      // ignore invalid JSON; incoming wins for keys
    }
  }

  return { ...base, ...incoming };
}

function candidateKey(sessionId: string, candidateId: string): string {
  return `${sessionId}:${candidateId}`;
}

function countByStatus<T extends { status: string }>(
  items: T[],
  status: string,
): number {
  return items.filter((item) => item.status === status).length;
}

function buildSyncHint(
  session: ResearchSession,
  includeDeferred: boolean,
  entitiesUpserted: number,
  relationshipsUpserted: number,
  database: string,
): string | undefined {
  const hasCandidates =
    session.entityCandidates.length > 0 || session.relationshipCandidates.length > 0;
  if (!hasCandidates) {
    return "This session has no graph candidates yet. Run an investigation turn first.";
  }

  if (entitiesUpserted === 0 && relationshipsUpserted === 0) {
    const acceptedN =
      countByStatus(session.entityCandidates, "accepted") +
      countByStatus(session.relationshipCandidates, "accepted");
    const deferredN =
      countByStatus(session.entityCandidates, "deferred") +
      countByStatus(session.relationshipCandidates, "deferred");
    if (!includeDeferred && acceptedN === 0 && deferredN > 0) {
      return "Nothing was written: only accepted items sync by default. Accept graph rows in Graph review, or turn on \"Include deferred\" and sync again.";
    }
    return 'Nothing was written: only candidates with status "accepted" (or "deferred" when Include deferred is on) are persisted. Accept the rows you want, then sync again.';
  }

  return `In Neo4j Browser, select database "${database}" (Aura often uses the instance id, not neo4j), then run: MATCH (e:Entity) WHERE toLower(e.displayName) CONTAINS 'fragment' RETURN e LIMIT 25`;
}

async function findExistingEntity(
  tx: ManagedTransaction,
  sessionId: string,
  entity: EntityCandidate,
  nameNorm: string,
): Promise<string | null> {
  const key = candidateKey(sessionId, entity.id);

  const byKey = await tx.run(
    `
    MATCH (e:Entity)
    WHERE $candidateKey IN coalesce(e.candidateKeys, [])
    RETURN elementId(e) AS id
    LIMIT 1
    `,
    { candidateKey: key },
  );
  if (byKey.records.length > 0) {
    return String(byKey.records[0].get("id"));
  }

  if (entity.externalIds.length > 0) {
    const byExternal = await tx.run(
      `
      MATCH (e:Entity)
      WHERE any(x IN coalesce(e.externalIds, []) WHERE x IN $externalIds)
      RETURN elementId(e) AS id
      LIMIT 1
      `,
      { externalIds: entity.externalIds },
    );
    if (byExternal.records.length > 0) {
      return String(byExternal.records[0].get("id"));
    }
  }

  const byNameKind = await tx.run(
    `
    MATCH (e:Entity)
    WHERE e.nameNorm = $nameNorm AND e.provisionalKind = $kind
    RETURN elementId(e) AS id
    LIMIT 1
    `,
    { nameNorm, kind: entity.provisionalKind },
  );
  if (byNameKind.records.length > 0) {
    return String(byNameKind.records[0].get("id"));
  }

  return null;
}

async function upsertEntityNode(
  tx: ManagedTransaction,
  sessionId: string,
  entity: EntityCandidate,
  nameNorm: string,
): Promise<string> {
  const key = candidateKey(sessionId, entity.id);
  const existingId = await findExistingEntity(tx, sessionId, entity, nameNorm);

  if (existingId) {
    const read = await tx.run(
      `MATCH (e:Entity) WHERE elementId(e) = $id RETURN e`,
      { id: existingId },
    );
    const raw = read.records[0]?.get("e");
    const props =
      raw && neo4j.isNode(raw) ? raw.properties : ({} as Record<string, unknown>);

    const mergedAliases = mergeStringLists(props.aliases, entity.aliases);
    const mergedExternalIds = mergeStringLists(props.externalIds, entity.externalIds);
    const mergedEvidence = mergeStringLists(props.evidenceSnippetIds, entity.evidenceSnippetIds);
    const mergedKeys = mergeStringLists(props.candidateKeys, [key]);
    const mergedAttributes = mergeAttributes(props.attributesJson, entity.attributes);

    await tx.run(
      `
      MATCH (e:Entity) WHERE elementId(e) = $id
      SET e.displayName = $displayName,
          e.nameNorm = $nameNorm,
          e.provisionalKind = $provisionalKind,
          e.aliases = $aliases,
          e.externalIds = $externalIds,
          e.attributesJson = $attributesJson,
          e.evidenceSnippetIds = $evidenceSnippetIds,
          e.candidateKeys = $candidateKeys,
          e.status = $status,
          e.updatedAt = $updatedAt,
          e.lastSessionId = $lastSessionId
      `,
      {
        id: existingId,
        displayName: entity.displayName,
        nameNorm,
        provisionalKind: entity.provisionalKind,
        aliases: mergedAliases,
        externalIds: mergedExternalIds,
        attributesJson: JSON.stringify(mergedAttributes),
        evidenceSnippetIds: mergedEvidence,
        candidateKeys: mergedKeys,
        status: entity.status,
        updatedAt: new Date().toISOString(),
        lastSessionId: sessionId,
      },
    );

    return existingId;
  }

  const created = await tx.run(
    `
    CREATE (e:Entity)
    SET e.displayName = $displayName,
        e.nameNorm = $nameNorm,
        e.provisionalKind = $provisionalKind,
        e.aliases = $aliases,
        e.externalIds = $externalIds,
        e.attributesJson = $attributesJson,
        e.evidenceSnippetIds = $evidenceSnippetIds,
        e.candidateKeys = $candidateKeys,
        e.status = $status,
        e.createdAt = $createdAt,
        e.updatedAt = $updatedAt,
        e.lastSessionId = $lastSessionId
    RETURN elementId(e) AS id
    `,
    {
      displayName: entity.displayName,
      nameNorm,
      provisionalKind: entity.provisionalKind,
      aliases: uniqueStrings(entity.aliases),
      externalIds: uniqueStrings(entity.externalIds),
      attributesJson: JSON.stringify(entity.attributes),
      evidenceSnippetIds: uniqueStrings(entity.evidenceSnippetIds),
      candidateKeys: [key],
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: new Date().toISOString(),
      lastSessionId: sessionId,
    },
  );

  return String(created.records[0].get("id"));
}

async function mergeResearchSessionNode(tx: ManagedTransaction, session: ResearchSession): Promise<void> {
  await tx.run(
    `
    MERGE (s:ResearchSession { id: $id })
    SET s.title = $title,
        s.seedQuery = $seedQuery,
        s.updatedAt = $updatedAt
    `,
    {
      id: session.id,
      title: session.title,
      seedQuery: session.seedQuery,
      updatedAt: new Date().toISOString(),
    },
  );
}

async function mergeGraphRelationship(
  tx: ManagedTransaction,
  sessionId: string,
  relationship: RelationshipCandidate,
  sourceElementId: string,
  targetElementId: string,
): Promise<void> {
  await tx.run(
    `
    MATCH (source:Entity) WHERE elementId(source) = $sourceId
    MATCH (target:Entity) WHERE elementId(target) = $targetId
    MERGE (source)-[r:GRAPH_REL { sessionId: $sessionId, relationshipId: $relationshipId }]->(target)
    SET r.verb = $verb,
        r.confidence = $confidence,
        r.status = $status,
        r.evidenceSnippetIds = $evidenceSnippetIds,
        r.updatedAt = $updatedAt
    `,
    {
      sourceId: sourceElementId,
      targetId: targetElementId,
      sessionId,
      relationshipId: relationship.id,
      verb: relationship.verb,
      confidence: relationship.confidence,
      status: relationship.status,
      evidenceSnippetIds: uniqueStrings(relationship.evidenceSnippetIds),
      updatedAt: new Date().toISOString(),
    },
  );
}

export async function persistResearchSessionToNeo4j(
  session: ResearchSession,
  options: { includeDeferred?: boolean } = {},
): Promise<Neo4jSyncResult> {
  const config = getNeo4jConfig();
  const driver = getNeo4jDriver();
  if (!config || !driver) {
    throw new Error(
      "Neo4j is not configured. Set NEO4J_URI, NEO4J_USERNAME (or NEO4J_USER), and NEO4J_PASSWORD in the environment.",
    );
  }

  const includeDeferred = Boolean(options.includeDeferred);

  function shouldSyncReviewStatus(status: string): boolean {
    if (status === "accepted") {
      return true;
    }
    return includeDeferred && status === "deferred";
  }

  const entityFilter = (entity: EntityCandidate) => shouldSyncReviewStatus(entity.status);
  const relationshipFilter = (relationship: RelationshipCandidate) =>
    shouldSyncReviewStatus(relationship.status);

  const entitiesToWrite = session.entityCandidates.filter(entityFilter);
  const relationshipsToWrite = session.relationshipCandidates.filter(relationshipFilter);

  const neoSession = driver.session({ database: config.database });
  const skippedRelationships: Neo4jSyncSkippedRelationship[] = [];

  try {
    const summary = await neoSession.executeWrite(async (tx) => {
      await mergeResearchSessionNode(tx, session);

      const candidateIdToElementId = new Map<string, string>();

      for (const entity of entitiesToWrite) {
        const nameNorm = normalizeName(entity.displayName);
        const elementId = await upsertEntityNode(tx, session.id, entity, nameNorm);
        candidateIdToElementId.set(entity.id, elementId);

        await tx.run(
          `
          MATCH (s:ResearchSession { id: $sessionId })
          MATCH (e:Entity) WHERE elementId(e) = $entityElementId
          MERGE (s)-[l:SESSION_INCLUDES_ENTITY { candidateKey: $candidateKey }]->(e)
          SET l.updatedAt = $updatedAt
          `,
          {
            sessionId: session.id,
            entityElementId: elementId,
            candidateKey: candidateKey(session.id, entity.id),
            updatedAt: new Date().toISOString(),
          },
        );
      }

      let relationshipCount = 0;

      for (const relationship of relationshipsToWrite) {
        const sourceId = candidateIdToElementId.get(relationship.sourceEntityId);
        const targetId = candidateIdToElementId.get(relationship.targetEntityId);

        if (!sourceId || !targetId) {
          skippedRelationships.push({
            relationshipId: relationship.id,
            reason:
              !sourceId && !targetId
                ? "Source and target entities were not in the synced entity set (accept them or include deferred entities)."
                : !sourceId
                  ? "Source entity was not in the synced entity set."
                  : "Target entity was not in the synced entity set.",
          });
          continue;
        }

        await mergeGraphRelationship(tx, session.id, relationship, sourceId, targetId);
        relationshipCount += 1;
      }

      return {
        entitiesUpserted: entitiesToWrite.length,
        relationshipsUpserted: relationshipCount,
      };
    });

    const sessionSnapshot: Neo4jSyncSessionSnapshot = {
      entityCandidates: session.entityCandidates.length,
      relationshipCandidates: session.relationshipCandidates.length,
      entitiesAccepted: countByStatus(session.entityCandidates, "accepted"),
      entitiesDeferred: countByStatus(session.entityCandidates, "deferred"),
      entitiesProposed: countByStatus(session.entityCandidates, "proposed"),
      entitiesRejected: countByStatus(session.entityCandidates, "rejected"),
      relationshipsAccepted: countByStatus(session.relationshipCandidates, "accepted"),
      relationshipsDeferred: countByStatus(session.relationshipCandidates, "deferred"),
      relationshipsProposed: countByStatus(session.relationshipCandidates, "proposed"),
      relationshipsRejected: countByStatus(session.relationshipCandidates, "rejected"),
    };

    const hint = buildSyncHint(
      session,
      includeDeferred,
      summary.entitiesUpserted,
      summary.relationshipsUpserted,
      config.database,
    );

    return {
      sessionId: session.id,
      database: config.database,
      entitiesUpserted: summary.entitiesUpserted,
      relationshipsUpserted: summary.relationshipsUpserted,
      skippedRelationships,
      includeDeferred,
      sessionSnapshot,
      hint,
    };
  } finally {
    await neoSession.close();
  }
}
