import {
  TypeDBHttpDriver,
  isApiErrorResponse,
  isOkResponse,
  type ApiResponse,
  type ConceptRow,
  type QueryResponse,
} from "@typedb/driver-http";
import { getTypeDbConfig } from "@/src/lib/server/config";
import {
  buildSessionSnapshot,
  buildTypeDbSyncHint,
  candidateKey,
  escapeTypeqlString,
  mergeAttributes,
  mergeStringLists,
  normalizeName,
  shouldSyncReviewStatus,
  uniqueStrings,
} from "@/src/lib/server/graph-persistence/helpers";
import { WORKBENCH_TYPEDB3_SCHEMA_LINES } from "@/src/lib/server/graph-persistence/typedb-workbench-schema";
import type { GraphPersistence, GraphSyncResult } from "@/src/lib/server/graph-persistence/types";
import { extractWorkbenchVizNeighborhood } from "@/src/lib/workbench-viz/viz-neighborhood";
import type { WorkbenchVizEdge, WorkbenchVizGraph, WorkbenchVizNode } from "@/src/types/workbench-viz-graph";
import type {
  EntityCandidate,
  RelationshipCandidate,
  ResearchSession,
  ReviewStatus,
} from "@/src/types/research-session";

let driverSingleton: TypeDBHttpDriver | null = null;
const schemaReadyForDatabase = new Set<string>();

function parseReviewStatus(raw: string | null): ReviewStatus | undefined {
  if (!raw) {
    return undefined;
  }
  const v = raw.trim().toLowerCase();
  if (v === "proposed" || v === "accepted" || v === "deferred" || v === "rejected") {
    return v;
  }
  return undefined;
}

function getDriver(cfg: NonNullable<ReturnType<typeof getTypeDbConfig>>): TypeDBHttpDriver {
  if (!driverSingleton) {
    driverSingleton = new TypeDBHttpDriver({
      username: cfg.username,
      password: cfg.password,
      addresses: cfg.addresses,
    });
  }
  return driverSingleton;
}

function unwrapApi<T>(res: ApiResponse<T>, context: string): T {
  const r = res as ApiResponse;
  if (isApiErrorResponse(r)) {
    throw new Error(`${context}: ${r.err.message}`);
  }
  return (r as { ok: T }).ok;
}

/** True if this IID is a direct workbench `graph-entity` (`isa!`), avoiding accidental subtype matches. */
async function iidIsWorkbenchGraphEntity(
  driver: TypeDBHttpDriver,
  txId: string,
  iid: string,
): Promise<boolean> {
  const q = `
match
$e iid ${iid};
$e isa! graph-entity;
`.trim();
  const r = await runInTx(driver, txId, q, "verifyWorkbenchGraphEntity");
  return firstEntityIid(r) !== null;
}

function firstEntityIid(response: QueryResponse): string | null {
  if (response.answerType !== "conceptRows" || !response.answers?.length) {
    return null;
  }
  const row = response.answers[0].data;
  for (const concept of Object.values(row)) {
    if (concept?.kind === "entity") {
      return concept.iid;
    }
  }
  return null;
}

function rowHasRelation(response: QueryResponse, varName: string): boolean {
  if (response.answerType !== "conceptRows" || !response.answers?.length) {
    return false;
  }
  const concept = response.answers[0].data[varName];
  return concept?.kind === "relation";
}

function attributeValue(row: ConceptRow, varName: string): string | null {
  const concept = row[varName];
  if (concept?.kind === "attribute") {
    const v = concept.value;
    return v === undefined || v === null ? null : String(v);
  }
  return null;
}

function entityIidFromRow(row: ConceptRow, varName: string): string | null {
  const concept = row[varName];
  if (concept?.kind === "entity" && concept.iid) {
    return String(concept.iid);
  }
  return null;
}

async function runSchemaLine(
  driver: TypeDBHttpDriver,
  database: string,
  line: string,
): Promise<void> {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("//")) {
    return;
  }
  const res = await driver.oneShotQuery(trimmed, true, database, "schema");
  if (isApiErrorResponse(res)) {
    const msg = String(res.err?.message ?? "").toLowerCase();
    if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("conflict")) {
      return;
    }
    throw new Error(`TypeDB schema: ${trimmed.slice(0, 100)} — ${res.err.message}`);
  }
}

async function ensureWorkbenchSchema(driver: TypeDBHttpDriver, database: string): Promise<void> {
  if (schemaReadyForDatabase.has(database)) {
    return;
  }
  for (const line of WORKBENCH_TYPEDB3_SCHEMA_LINES) {
    await runSchemaLine(driver, database, line);
  }
  schemaReadyForDatabase.add(database);
}

async function openWriteTx(driver: TypeDBHttpDriver, database: string): Promise<string> {
  const res = await driver.openTransaction(database, "write", {
    transactionTimeoutMillis: 120_000,
  });
  const ok = unwrapApi(res, "openTransaction");
  return ok.transactionId;
}

async function openReadTx(driver: TypeDBHttpDriver, database: string): Promise<string> {
  const res = await driver.openTransaction(database, "read", {
    transactionTimeoutMillis: 60_000,
  });
  const ok = unwrapApi(res, "openTransaction");
  return ok.transactionId;
}

async function runInTx(
  driver: TypeDBHttpDriver,
  txId: string,
  query: string,
  context: string,
): Promise<QueryResponse> {
  const raw = await driver.query(txId, query.trim(), {});
  const res = raw as ApiResponse;
  if (isApiErrorResponse(res)) {
    throw new Error(`${context}: ${res.err.message}`);
  }
  if (!isOkResponse(res as ApiResponse<QueryResponse>)) {
    throw new Error(`${context}: empty response`);
  }
  return (res as { ok: QueryResponse }).ok;
}

async function commitTx(driver: TypeDBHttpDriver, txId: string): Promise<void> {
  const res = await driver.commitTransaction(txId);
  unwrapApi(res, "commitTransaction");
}

async function rollbackTx(driver: TypeDBHttpDriver, txId: string): Promise<void> {
  const res = await driver.rollbackTransaction(txId);
  if (isApiErrorResponse(res)) {
    return;
  }
}

async function findGraphEntityIid(
  driver: TypeDBHttpDriver,
  txId: string,
  sessionId: string,
  entity: EntityCandidate,
  nameNorm: string,
): Promise<string | null> {
  const key = candidateKey(sessionId, entity.id);
  const keyLit = escapeTypeqlString(key);
  const qKey = `
match
$e isa! graph-entity,
  has entity-candidate-keys-json $jk;
$jk contains "${keyLit}";
`.trim();
  const r1 = await runInTx(driver, txId, qKey, "findEntityByCandidateKeys");
  const byKey = firstEntityIid(r1);
  if (byKey) {
    return byKey;
  }

  for (const ext of uniqueStrings(entity.externalIds)) {
    const extLit = escapeTypeqlString(ext);
    if (!extLit) {
      continue;
    }
    const qExt = `
match
$e isa! graph-entity,
  has entity-external-ids-json $je;
$je contains "${extLit}";
`.trim();
    const r2 = await runInTx(driver, txId, qExt, "findEntityByExternalId");
    const found = firstEntityIid(r2);
    if (found) {
      return found;
    }
  }

  const nn = escapeTypeqlString(nameNorm);
  const kind = escapeTypeqlString(entity.provisionalKind);
  const qName = `
match
$e isa! graph-entity,
  has normalized-name $nn,
  has provisional-entity-kind $pk;
$nn == "${nn}";
$pk == "${kind}";
`.trim();
  const r3 = await runInTx(driver, txId, qName, "findEntityByNameKind");
  return firstEntityIid(r3);
}

function parseJsonArray(raw: string, fallback: unknown[]): unknown[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

async function readEntityJsonFieldsByCandidateKey(
  driver: TypeDBHttpDriver,
  txId: string,
  sessionId: string,
  entityId: string,
): Promise<{
  aliasesJson: string;
  externalIdsJson: string;
  attributesJson: string;
  evidenceJson: string;
  keysJson: string;
} | null> {
  const keyLit = escapeTypeqlString(candidateKey(sessionId, entityId));
  const q = `
match
$e isa! graph-entity,
  has entity-candidate-keys-json $jk;
$jk contains "${keyLit}";
$e has entity-aliases-json $aliases;
$e has entity-external-ids-json $ext;
$e has entity-attributes-json $attrs;
$e has entity-evidence-snippet-ids-json $evid;
$e has entity-candidate-keys-json $keys;
`.trim();
  const res = await runInTx(driver, txId, q, "readEntityJson");
  if (res.answerType !== "conceptRows" || !res.answers?.length) {
    return null;
  }
  const row = res.answers[0].data;
  return {
    aliasesJson: attributeValue(row, "aliases") ?? "[]",
    externalIdsJson: attributeValue(row, "ext") ?? "[]",
    attributesJson: attributeValue(row, "attrs") ?? "{}",
    evidenceJson: attributeValue(row, "evid") ?? "[]",
    keysJson: attributeValue(row, "keys") ?? "[]",
  };
}

async function readEntityJsonFieldsByIid(
  driver: TypeDBHttpDriver,
  txId: string,
  iid: string,
): Promise<{
  aliasesJson: string;
  externalIdsJson: string;
  attributesJson: string;
  evidenceJson: string;
  keysJson: string;
} | null> {
  const q = `
match
$e iid ${iid};
$e isa! graph-entity;
$e has entity-aliases-json $aliases;
$e has entity-external-ids-json $ext;
$e has entity-attributes-json $attrs;
$e has entity-evidence-snippet-ids-json $evid;
$e has entity-candidate-keys-json $keys;
`.trim();
  const res = await runInTx(driver, txId, q, "readEntityJsonByIid");
  if (res.answerType !== "conceptRows" || !res.answers?.length) {
    return null;
  }
  const row = res.answers[0].data;
  return {
    aliasesJson: attributeValue(row, "aliases") ?? "[]",
    externalIdsJson: attributeValue(row, "ext") ?? "[]",
    attributesJson: attributeValue(row, "attrs") ?? "{}",
    evidenceJson: attributeValue(row, "evid") ?? "[]",
    keysJson: attributeValue(row, "keys") ?? "[]",
  };
}

async function mergeResearchSession(
  driver: TypeDBHttpDriver,
  txId: string,
  session: ResearchSession,
): Promise<void> {
  const sid = escapeTypeqlString(session.id);
  const title = escapeTypeqlString(session.title);
  const seed = escapeTypeqlString(session.seedQuery);
  const updated = escapeTypeqlString(new Date().toISOString());

  const matchExisting = `
match $s isa! research-session, has session-id $sid;
$sid == "${sid}";
`.trim();
  const existing = await runInTx(driver, txId, matchExisting, "matchResearchSession");
  if (firstEntityIid(existing)) {
    const upd = `
match $s isa! research-session, has session-id $sid;
$sid == "${sid}";
update
$s has title-string "${title}",
  has seed-query-text "${seed}",
  has session-updated-at "${updated}";
`.trim();
    await runInTx(driver, txId, upd, "updateResearchSession");
    return;
  }

  const ins = `
insert
$s isa research-session,
  has session-id "${sid}",
  has title-string "${title}",
  has seed-query-text "${seed}",
  has session-updated-at "${updated}";
`.trim();
  await runInTx(driver, txId, ins, "insertResearchSession");
}

async function upsertGraphEntity(
  driver: TypeDBHttpDriver,
  txId: string,
  sessionId: string,
  entity: EntityCandidate,
  nameNorm: string,
): Promise<void> {
  const key = candidateKey(sessionId, entity.id);
  const keyLit = escapeTypeqlString(key);
  let existingIid = await findGraphEntityIid(driver, txId, sessionId, entity, nameNorm);
  if (existingIid && !(await iidIsWorkbenchGraphEntity(driver, txId, existingIid))) {
    existingIid = null;
  }

  const display = escapeTypeqlString(entity.displayName);
  const nn = escapeTypeqlString(nameNorm);
  const pk = escapeTypeqlString(entity.provisionalKind);
  const st = escapeTypeqlString(entity.status);
  const updated = escapeTypeqlString(new Date().toISOString());
  const lastSess = escapeTypeqlString(sessionId);

  if (existingIid) {
    let prev = await readEntityJsonFieldsByCandidateKey(driver, txId, sessionId, entity.id);
    if (!prev) {
      prev = await readEntityJsonFieldsByIid(driver, txId, existingIid);
    }
    const mergedAliases = mergeStringLists(
      parseJsonArray(prev?.aliasesJson ?? "[]", []),
      entity.aliases,
    );
    const mergedExt = mergeStringLists(
      parseJsonArray(prev?.externalIdsJson ?? "[]", []),
      entity.externalIds,
    );
    const mergedEvidence = mergeStringLists(
      parseJsonArray(prev?.evidenceJson ?? "[]", []),
      entity.evidenceSnippetIds,
    );
    const mergedKeys = mergeStringLists(parseJsonArray(prev?.keysJson ?? "[]", []), [key]);
    const mergedAttrs = mergeAttributes(prev?.attributesJson ?? "{}", entity.attributes);

    const q = `
match
$e iid ${existingIid};
update
$e has display-name "${display}",
  has normalized-name "${nn}",
  has provisional-entity-kind "${pk}",
  has review-status "${st}",
  has entity-aliases-json "${escapeTypeqlString(JSON.stringify(mergedAliases))}",
  has entity-external-ids-json "${escapeTypeqlString(JSON.stringify(mergedExt))}",
  has entity-attributes-json "${escapeTypeqlString(JSON.stringify(mergedAttrs))}",
  has entity-evidence-snippet-ids-json "${escapeTypeqlString(JSON.stringify(mergedEvidence))}",
  has entity-candidate-keys-json "${escapeTypeqlString(JSON.stringify(mergedKeys))}",
  has entity-updated-at "${updated}",
  has entity-last-session-id "${lastSess}";
`.trim();
    await runInTx(driver, txId, q, "updateGraphEntity");
    return;
  }

  const aliases = escapeTypeqlString(JSON.stringify(uniqueStrings(entity.aliases)));
  const ext = escapeTypeqlString(JSON.stringify(uniqueStrings(entity.externalIds)));
  const attrs = escapeTypeqlString(JSON.stringify(entity.attributes));
  const evid = escapeTypeqlString(JSON.stringify(uniqueStrings(entity.evidenceSnippetIds)));
  const keys = escapeTypeqlString(JSON.stringify([key]));
  const created = escapeTypeqlString(entity.createdAt);

  const ins = `
insert
$e isa graph-entity,
  has display-name "${display}",
  has normalized-name "${nn}",
  has provisional-entity-kind "${pk}",
  has review-status "${st}",
  has entity-aliases-json "${aliases}",
  has entity-external-ids-json "${ext}",
  has entity-attributes-json "${attrs}",
  has entity-evidence-snippet-ids-json "${evid}",
  has entity-candidate-keys-json "${keys}",
  has entity-created-at "${created}",
  has entity-updated-at "${updated}",
  has entity-last-session-id "${lastSess}";
`.trim();
  await runInTx(driver, txId, ins, "insertGraphEntity");
}

async function mergeSessionIncludes(
  driver: TypeDBHttpDriver,
  txId: string,
  sessionId: string,
  entity: EntityCandidate,
): Promise<void> {
  const sid = escapeTypeqlString(sessionId);
  const ck = escapeTypeqlString(candidateKey(sessionId, entity.id));
  const keyLit = escapeTypeqlString(candidateKey(sessionId, entity.id));
  const updated = escapeTypeqlString(new Date().toISOString());

  const matchLink = `
match
$s isa! research-session, has session-id $sid;
$sid == "${sid}";
$e isa! graph-entity, has entity-candidate-keys-json $jk;
$jk contains "${keyLit}";
$l isa! session-includes-entity,
  links (container-session: $s, member-entity: $e),
  has inclusion-candidate-key $ick;
$ick == "${ck}";
`.trim();
  const found = await runInTx(driver, txId, matchLink, "matchSessionIncludes");
  if (rowHasRelation(found, "l")) {
    const upd = `
match
$l isa! session-includes-entity, has inclusion-candidate-key $ick;
$ick == "${ck}";
update $l has inclusion-updated-at "${updated}";
`.trim();
    await runInTx(driver, txId, upd, "updateSessionIncludes");
    return;
  }

  const ins = `
match
$s isa! research-session, has session-id $sid;
$sid == "${sid}";
$e isa! graph-entity, has entity-candidate-keys-json $jk;
$jk contains "${keyLit}";
insert
$l isa session-includes-entity,
  links (container-session: $s, member-entity: $e),
  has inclusion-candidate-key "${ck}",
  has inclusion-updated-at "${updated}";
`.trim();
  await runInTx(driver, txId, ins, "insertSessionIncludes");
}

function graphRelEdgeKey(sessionId: string, relationshipId: string): string {
  return `${sessionId}:${relationshipId}`;
}

async function mergeGraphRelationship(
  driver: TypeDBHttpDriver,
  txId: string,
  sessionId: string,
  relationship: RelationshipCandidate,
  sourceKey: string,
  targetKey: string,
): Promise<void> {
  const edgeKey = escapeTypeqlString(graphRelEdgeKey(sessionId, relationship.id));
  const sk = escapeTypeqlString(sourceKey);
  const tk = escapeTypeqlString(targetKey);
  const rsid = escapeTypeqlString(sessionId);
  const rid = escapeTypeqlString(relationship.id);
  const verb = escapeTypeqlString(relationship.verb);
  const conf = escapeTypeqlString(String(relationship.confidence));
  const st = escapeTypeqlString(relationship.status);
  const evid = escapeTypeqlString(JSON.stringify(uniqueStrings(relationship.evidenceSnippetIds)));
  const updated = escapeTypeqlString(new Date().toISOString());

  const matchR = `
match $r isa! graph-relationship, has graph-rel-edge-key $gk;
$gk == "${edgeKey}";
`.trim();
  const existing = await runInTx(driver, txId, matchR, "matchGraphRel");
  const hasRel = rowHasRelation(existing, "r");

  if (hasRel) {
    const upd = `
match $r isa! graph-relationship, has graph-rel-edge-key $gk;
$gk == "${edgeKey}";
update
$r has rel-session-id "${rsid}",
  has rel-relationship-id "${rid}",
  has rel-verb "${verb}",
  has rel-confidence "${conf}",
  has rel-review-status "${st}",
  has rel-evidence-snippet-ids-json "${evid}",
  has rel-updated-at "${updated}";
`.trim();
    await runInTx(driver, txId, upd, "updateGraphRel");
    return;
  }

  const ins = `
match
$src isa! graph-entity, has entity-candidate-keys-json $jsk;
$jsk contains "${sk}";
$tgt isa! graph-entity, has entity-candidate-keys-json $jtk;
$jtk contains "${tk}";
insert
$r isa graph-relationship,
  links (source-entity: $src, target-entity: $tgt),
  has graph-rel-edge-key "${edgeKey}",
  has rel-session-id "${rsid}",
  has rel-relationship-id "${rid}",
  has rel-verb "${verb}",
  has rel-confidence "${conf}",
  has rel-review-status "${st}",
  has rel-evidence-snippet-ids-json "${evid}",
  has rel-updated-at "${updated}";
`.trim();
  await runInTx(driver, txId, ins, "insertGraphRel");
}

async function persistResearchSessionToTypeDb(
  session: ResearchSession,
  options: { includeDeferred?: boolean } = {},
): Promise<GraphSyncResult> {
  const config = getTypeDbConfig();
  if (!config) {
    throw new Error(
      "TypeDB is not configured. Set TYPEDB_USERNAME, TYPEDB_PASSWORD, TYPEDB_ADDRESS (or TYPEDB_HOST), TYPEDB_DATABASE, or TYPEDB_CONNECTION_STRING (see product/.env.example and product/README.md).",
    );
  }

  const includeDeferred = Boolean(options.includeDeferred);
  const entityFilter = (entity: EntityCandidate) => shouldSyncReviewStatus(entity.status, includeDeferred);
  const relationshipFilter = (relationship: RelationshipCandidate) =>
    shouldSyncReviewStatus(relationship.status, includeDeferred);

  const entitiesToWrite = session.entityCandidates.filter(entityFilter);
  const relationshipsToWrite = session.relationshipCandidates.filter(relationshipFilter);
  const skippedRelationships: { relationshipId: string; reason: string }[] = [];

  const driver = getDriver(config);
  await ensureWorkbenchSchema(driver, config.database);

  const txId = await openWriteTx(driver, config.database);
  let relationshipCount = 0;
  try {
    await mergeResearchSession(driver, txId, session);

    const candidateIdToKey = new Map<string, string>();
    for (const entity of entitiesToWrite) {
      const nameNorm = normalizeName(entity.displayName);
      await upsertGraphEntity(driver, txId, session.id, entity, nameNorm);
      await mergeSessionIncludes(driver, txId, session.id, entity);
      candidateIdToKey.set(entity.id, candidateKey(session.id, entity.id));
    }

    for (const relationship of relationshipsToWrite) {
      const sourceKey = candidateIdToKey.get(relationship.sourceEntityId);
      const targetKey = candidateIdToKey.get(relationship.targetEntityId);
      if (!sourceKey || !targetKey) {
        skippedRelationships.push({
          relationshipId: relationship.id,
          reason:
            !sourceKey && !targetKey
              ? "Source and target entities were not in the synced entity set (accept them or include deferred entities)."
              : !sourceKey
                ? "Source entity was not in the synced entity set."
                : "Target entity was not in the synced entity set.",
        });
        continue;
      }
      await mergeGraphRelationship(driver, txId, session.id, relationship, sourceKey, targetKey);
      relationshipCount += 1;
    }

    await commitTx(driver, txId);
  } catch (err) {
    await rollbackTx(driver, txId);
    throw err;
  }

  const sessionSnapshot = buildSessionSnapshot(session);
  const hint = buildTypeDbSyncHint(
    session,
    includeDeferred,
    entitiesToWrite.length,
    relationshipCount,
    config.database,
  );

  return {
    sessionId: session.id,
    backend: "typedb",
    database: config.database,
    entitiesUpserted: entitiesToWrite.length,
    relationshipsUpserted: relationshipCount,
    skippedRelationships,
    includeDeferred,
    sessionSnapshot,
    hint,
  };
}

async function fetchSessionVizGraphFromTypeDb(
  sessionId: string,
  options?: { focusNodeId?: string },
): Promise<WorkbenchVizGraph> {
  const config = getTypeDbConfig();
  if (!config) {
    throw new Error(
      "TypeDB is not configured. Set TYPEDB_USERNAME, TYPEDB_PASSWORD, TYPEDB_ADDRESS (or TYPEDB_HOST), TYPEDB_DATABASE, or TYPEDB_CONNECTION_STRING (see product/.env.example and product/README.md).",
    );
  }

  const sidLit = escapeTypeqlString(sessionId);
  const driver = getDriver(config);
  await ensureWorkbenchSchema(driver, config.database);
  const txId = await openReadTx(driver, config.database);

  try {
    const nodesQuery = `
match
$s isa! research-session, has session-id $sid;
$sid == "${sidLit}";
$l isa! session-includes-entity,
  links (container-session: $s, member-entity: $e);
$e isa! graph-entity,
  has display-name $dn,
  has provisional-entity-kind $pk,
  has review-status $st;
`.trim();

    const nodesQueryRelaxed = `
match
$s isa! research-session, has session-id $sid;
$sid == "${sidLit}";
$l isa! session-includes-entity,
  links (container-session: $s, member-entity: $e);
$e isa! graph-entity,
  has display-name $dn,
  has provisional-entity-kind $pk;
`.trim();

    let nodesRes = await runInTx(driver, txId, nodesQuery, "vizSessionEntities");
    if (nodesRes.answerType !== "conceptRows" || !nodesRes.answers?.length) {
      nodesRes = await runInTx(driver, txId, nodesQueryRelaxed, "vizSessionEntitiesRelaxed");
    }
    const nodeMap = new Map<string, WorkbenchVizNode>();
    if (nodesRes.answerType === "conceptRows" && nodesRes.answers?.length) {
      for (const { data: row } of nodesRes.answers) {
        const iid = entityIidFromRow(row, "e");
        if (!iid) {
          continue;
        }
        const label = attributeValue(row, "dn")?.trim() || "Entity";
        const pk = attributeValue(row, "pk");
        const st = attributeValue(row, "st");
        const reviewStatus = parseReviewStatus(st);
        nodeMap.set(iid, {
          id: iid,
          label,
          subtitle: pk ?? undefined,
          reviewStatus,
        });
      }
    }

    const edgesQuery = `
match
$r isa! graph-relationship,
  has rel-session-id $rsid,
  has graph-rel-edge-key $gk,
  has rel-verb $verb,
  has rel-review-status $rst;
$rsid == "${sidLit}";
$r links (source-entity: $src, target-entity: $tgt);
$src isa! graph-entity;
$tgt isa! graph-entity;
`.trim();

    const edgesQueryRelaxed = `
match
$r isa! graph-relationship,
  has rel-session-id $rsid,
  has graph-rel-edge-key $gk,
  has rel-verb $verb;
$rsid == "${sidLit}";
$r links (source-entity: $src, target-entity: $tgt);
$src isa! graph-entity;
$tgt isa! graph-entity;
`.trim();

    let edgesRes = await runInTx(driver, txId, edgesQuery, "vizSessionRels");
    if (edgesRes.answerType !== "conceptRows" || !edgesRes.answers?.length) {
      edgesRes = await runInTx(driver, txId, edgesQueryRelaxed, "vizSessionRelsRelaxed");
    }
    const edges: WorkbenchVizEdge[] = [];
    if (edgesRes.answerType === "conceptRows" && edgesRes.answers?.length) {
      for (const { data: row } of edgesRes.answers) {
        const src = entityIidFromRow(row, "src");
        const tgt = entityIidFromRow(row, "tgt");
        const edgeId = attributeValue(row, "gk");
        const verb = attributeValue(row, "verb");
        const rst = attributeValue(row, "rst");
        if (!src || !tgt || !edgeId) {
          continue;
        }
        edges.push({
          id: edgeId,
          source: src,
          target: tgt,
          label: verb ?? undefined,
          reviewStatus: parseReviewStatus(rst),
        });
        if (!nodeMap.has(src)) {
          nodeMap.set(src, { id: src, label: "Entity", reviewStatus: "proposed" });
        }
        if (!nodeMap.has(tgt)) {
          nodeMap.set(tgt, { id: tgt, label: "Entity", reviewStatus: "proposed" });
        }
      }
    }

    await rollbackTx(driver, txId);
    const full: WorkbenchVizGraph = {
      nodes: [...nodeMap.values()],
      edges,
    };
    const focus = options?.focusNodeId?.trim();
    if (focus) {
      const sub = extractWorkbenchVizNeighborhood(full, focus);
      if (sub) {
        return sub;
      }
    }
    return full;
  } catch (err) {
    await rollbackTx(driver, txId);
    throw err;
  }
}

export function createTypeDbGraphPersistence(): GraphPersistence {
  return {
    persistResearchSession: (session, opts) => persistResearchSessionToTypeDb(session, opts ?? {}),
    fetchSessionVizGraph: (sessionId, opts) => fetchSessionVizGraphFromTypeDb(sessionId, opts),
  };
}
