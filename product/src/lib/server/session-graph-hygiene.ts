import type {
  EntityCandidate,
  RelationshipCandidate,
  ResearchSession,
  ReviewStatus,
} from "@/src/types/research-session";
import { createEvent } from "@/src/lib/server/session-store";

/** Trim, collapse whitespace, lowercase — same contract as research-runtime identity checks. */
export function normalizeEntityMatchKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function stripLeadingArticle(key: string): string {
  if (key.startsWith("the ") && key.length > 4) {
    return key.slice(4).trim();
  }
  return key;
}

/** All normalized keys that identify this entity for duplicate detection. */
export function entityIdentityKeys(entity: EntityCandidate): Set<string> {
  const keys = new Set<string>();
  const add = (raw: string) => {
    const k = normalizeEntityMatchKey(raw);
    if (!k) {
      return;
    }
    keys.add(k);
    const stripped = stripLeadingArticle(k);
    if (stripped && stripped !== k) {
      keys.add(stripped);
    }
  };
  add(entity.displayName);
  for (const a of entity.aliases) {
    add(a);
  }
  return keys;
}

function externalIdKeySet(entity: EntityCandidate): Set<string> {
  return new Set(
    entity.externalIds.map((id) => id.trim().toLowerCase()).filter((id) => id.length > 0),
  );
}

const STATUS_RANK: Record<ReviewStatus, number> = {
  accepted: 4,
  deferred: 3,
  proposed: 2,
  rejected: 1,
};

function pickCanonicalEntity(cluster: EntityCandidate[]): EntityCandidate {
  return [...cluster].sort((a, b) => {
    const dr = STATUS_RANK[b.status] - STATUS_RANK[a.status];
    if (dr !== 0) {
      return dr;
    }
    const t = a.createdAt.localeCompare(b.createdAt);
    if (t !== 0) {
      return t;
    }
    return a.id.localeCompare(b.id);
  })[0];
}

function mergeEntityCluster(canonical: EntityCandidate, donors: EntityCandidate[]): void {
  const aliasSet = new Set(canonical.aliases.map((a) => a.trim()).filter(Boolean));
  const extSet = new Set(canonical.externalIds.map((e) => e.trim()).filter(Boolean));
  const snip = new Set(canonical.evidenceSnippetIds);

  for (const d of donors) {
    for (const a of d.aliases) {
      const t = a.trim();
      if (t) {
        aliasSet.add(t);
      }
    }
    for (const e of d.externalIds) {
      const t = e.trim();
      if (t) {
        extSet.add(t);
      }
    }
    for (const id of d.evidenceSnippetIds) {
      snip.add(id);
    }
    canonical.attributes = { ...canonical.attributes, ...d.attributes };
  }

  const canonName = normalizeEntityMatchKey(canonical.displayName);
  for (const d of donors) {
    const dn = d.displayName.trim();
    if (dn && normalizeEntityMatchKey(dn) !== canonName && !aliasSet.has(dn)) {
      aliasSet.add(dn);
    }
  }

  canonical.aliases = [...aliasSet];
  canonical.externalIds = [...extSet];
  canonical.evidenceSnippetIds = [...snip];

  let best: ReviewStatus = canonical.status;
  for (const d of donors) {
    if (STATUS_RANK[d.status] > STATUS_RANK[best]) {
      best = d.status;
    }
  }
  canonical.status = best;
}

export type GraphHygieneIssue =
  | { kind: "duplicate_entity_cluster"; mergedIds: string[]; canonicalId: string }
  | { kind: "duplicate_relationship_removed"; removedId: string; keptId: string }
  | { kind: "orphan_relationship_removed"; relationshipId: string; reason: string };

export type GraphHygieneReport = {
  issues: GraphHygieneIssue[];
  entitiesRemoved: number;
  relationshipsRemoved: number;
  relationshipsRewritten: number;
};

/**
 * Human-readable checklist for session graph QA (mirrors {@link applySessionGraphHygiene}).
 */
export const SESSION_GRAPH_HYGIENE_CHECKS: readonly string[] = [
  "Merge duplicate entity candidates that share a normalized display name, alias overlap, or any external id.",
  "Rewire relationship endpoints to the canonical entity after merges.",
  "Remove orphan relationship edges (missing endpoint) and self-loops.",
  "Collapse duplicate relationship triples (same source id, target id, and verb).",
];

/**
 * Repairs in-memory session graph artifacts: merges duplicate entity candidates
 * (same normalized name/alias overlap or shared external id), rewires relationships,
 * drops duplicate and orphan edges.
 */
export function applySessionGraphHygiene(session: ResearchSession): GraphHygieneReport {
  const issues: GraphHygieneIssue[] = [];
  const entities = session.entityCandidates;
  if (entities.length === 0) {
    return {
      issues,
      entitiesRemoved: 0,
      relationshipsRemoved: 0,
      relationshipsRewritten: 0,
    };
  }

  const n = entities.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(i: number): number {
    if (parent[i] !== i) {
      parent[i] = find(parent[i]);
    }
    return parent[i];
  }

  function union(i: number, j: number): void {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) {
      parent[Math.max(ri, rj)] = Math.min(ri, rj);
    }
  }

  const keyToFirstIndex = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    for (const key of entityIdentityKeys(entities[i])) {
      if (!keyToFirstIndex.has(key)) {
        keyToFirstIndex.set(key, i);
      } else {
        union(i, keyToFirstIndex.get(key)!);
      }
    }
  }

  const extToFirstIndex = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    for (const ext of externalIdKeySet(entities[i])) {
      if (!extToFirstIndex.has(ext)) {
        extToFirstIndex.set(ext, i);
      } else {
        union(i, extToFirstIndex.get(ext)!);
      }
    }
  }

  const clusters = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    const list = clusters.get(r) ?? [];
    list.push(i);
    clusters.set(r, list);
  }

  const idRemap = new Map<string, string>();
  let entitiesRemoved = 0;

  for (const indices of clusters.values()) {
    if (indices.length < 2) {
      continue;
    }
    const clusterEntities = indices.map((ix) => entities[ix]);
    const canonical = pickCanonicalEntity(clusterEntities);
    const donors = clusterEntities.filter((e) => e.id !== canonical.id);
    const mergedIds = donors.map((d) => d.id);

    mergeEntityCluster(canonical, donors);
    for (const id of mergedIds) {
      idRemap.set(id, canonical.id);
    }
    issues.push({
      kind: "duplicate_entity_cluster",
      mergedIds,
      canonicalId: canonical.id,
    });
    entitiesRemoved += donors.length;
  }

  let relationshipsRewritten = 0;
  for (const rel of session.relationshipCandidates) {
    const ns = idRemap.get(rel.sourceEntityId) ?? rel.sourceEntityId;
    const nt = idRemap.get(rel.targetEntityId) ?? rel.targetEntityId;
    if (ns !== rel.sourceEntityId || nt !== rel.targetEntityId) {
      rel.sourceEntityId = ns;
      rel.targetEntityId = nt;
      relationshipsRewritten += 1;
    }
  }

  if (idRemap.size > 0) {
    const removeIds = new Set(idRemap.keys());
    session.entityCandidates = session.entityCandidates.filter((e) => !removeIds.has(e.id));
  }

  const validIds = new Set(session.entityCandidates.map((e) => e.id));
  const rels = session.relationshipCandidates;
  const seenEdgeKeys = new Set<string>();
  const surviving: RelationshipCandidate[] = [];
  let relationshipsRemoved = 0;

  const relEdgeKey = (r: RelationshipCandidate) =>
    `${r.sourceEntityId}\0${r.targetEntityId}\0${r.verb.trim().toLowerCase()}`;

  for (const rel of rels) {
    if (!validIds.has(rel.sourceEntityId) || !validIds.has(rel.targetEntityId)) {
      issues.push({
        kind: "orphan_relationship_removed",
        relationshipId: rel.id,
        reason: "missing entity endpoint",
      });
      relationshipsRemoved += 1;
      continue;
    }
    if (rel.sourceEntityId === rel.targetEntityId) {
      issues.push({
        kind: "orphan_relationship_removed",
        relationshipId: rel.id,
        reason: "self-loop",
      });
      relationshipsRemoved += 1;
      continue;
    }
    const k = relEdgeKey(rel);
    if (seenEdgeKeys.has(k)) {
      const kept = surviving.find((x) => relEdgeKey(x) === k);
      issues.push({
        kind: "duplicate_relationship_removed",
        removedId: rel.id,
        keptId: kept?.id ?? "",
      });
      relationshipsRemoved += 1;
      continue;
    }
    seenEdgeKeys.add(k);
    surviving.push(rel);
  }

  session.relationshipCandidates = surviving;

  session.reviewDecisions = session.reviewDecisions.filter((d) => {
    if (d.itemType === "entity" && idRemap.has(d.itemId)) {
      return false;
    }
    if (d.itemType === "relationship") {
      return session.relationshipCandidates.some((r) => r.id === d.itemId);
    }
    return true;
  });

  const structuralChanges =
    entitiesRemoved > 0 || relationshipsRemoved > 0 || relationshipsRewritten > 0;
  if (structuralChanges) {
    session.events.push(
      createEvent(
        "session_metadata_updated",
        "success",
        "/api/sessions/graph-hygiene",
        "Graph hygiene: merged duplicate entities and repaired relationships.",
        {
          session_id: session.id,
          hygiene_entities_removed: String(entitiesRemoved),
          hygiene_relationships_removed: String(relationshipsRemoved),
          hygiene_relationships_rewritten: String(relationshipsRewritten),
        },
      ),
    );
  }

  return {
    issues,
    entitiesRemoved,
    relationshipsRemoved,
    relationshipsRewritten,
  };
}

/**
 * Non-mutating scan for duplicate entity clusters and obvious relationship problems.
 */
export function analyzeSessionGraphHygiene(session: ResearchSession): GraphHygieneReport {
  const clone = JSON.parse(JSON.stringify(session)) as ResearchSession;
  return applySessionGraphHygiene(clone);
}
