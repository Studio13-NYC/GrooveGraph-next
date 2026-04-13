/**
 * Import a Neo4j Browser / HTTP style JSON export (single object: { query, result })
 * into the configured TypeDB database as workbench graph-entity + graph-relationship rows
 * tied to a dedicated research-session (same persistence as "Sync to graph").
 *
 * Run from repo root:
 *   npm run import:neo4j-dump -w @groovegraph-next/product
 * Or with explicit path:
 *   npm exec -w @groovegraph-next/product -- tsx scripts/import-neo4j-dump-json-to-typedb.ts path/to/dump.json
 *
 * Conventions:
 * - Each record's `n` is the relationship source, `m` the target (matches MATCH (n)-[r]-(m) RETURN order).
 * - Relationship verb is inferred from `r.id` (e.g. member_of-…, part_of_genre-…, is-a-…).
 * - All candidates are marked accepted so they sync without "Include deferred".
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getGraphPersistence } from "@/src/lib/server/graph-persistence/get-graph-persistence";
import type {
  EntityCandidate,
  RelationshipCandidate,
  ResearchSession,
} from "@/src/types/research-session";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCT_ROOT = path.resolve(__dirname, "..");

const IMPORT_SESSION_ID = "neo4j-dump-json-import";

type DumpNode = {
  id?: string;
  name?: string;
  entityLabel?: string;
  __meta?: string;
};

type DumpRel = {
  id?: string;
  entityLabel?: string;
};

type DumpRecord = {
  n?: DumpNode;
  r?: DumpRel;
  m?: DumpNode;
};

type DumpJson = {
  query?: string;
  result?: {
    keys?: string[];
    records?: DumpRecord[];
  };
};

function nowIso(): string {
  return new Date().toISOString();
}

function verbFromRel(r: DumpRel): string {
  const id = (r.id ?? "").trim();
  if (!id) {
    return (r.entityLabel ?? "related").toLowerCase().replace(/\s+/g, "_");
  }
  if (id.startsWith("member_of")) return "member_of";
  if (id.startsWith("part_of_genre")) return "part_of_genre";
  if (id.startsWith("is-a-") || id.startsWith("is_a_")) return "is-a";
  if (id.startsWith("collaborated")) return "collaborated_with";
  if (id.startsWith("released")) return "released";
  if (id.startsWith("produced")) return "produced_by";
  if (id.startsWith("performed")) return "performed_by";
  const noHex = id.replace(/-[0-9a-f]{10,}$/i, "");
  if (noHex && noHex !== id) return noHex.replace(/-$/, "") || "related";
  return id.split("-")[0] || "related";
}

function provisionalKind(node: DumpNode): string {
  const raw = (node.entityLabel ?? "").trim();
  if (raw) return raw.toLowerCase();
  return "entity";
}

function toEntity(node: DumpNode): EntityCandidate | null {
  const id = (node.id ?? "").trim();
  if (!id) return null;
  const displayName = (node.name ?? "").trim() || id;
  const attrs: Record<string, string> = {
    neo4j_node_id: id,
  };
  if (node.entityLabel) {
    attrs.neo4j_entity_label = node.entityLabel;
  }
  if (node.__meta && node.__meta.trim()) {
    attrs.neo4j_meta_json = node.__meta.trim();
  }
  return {
    id,
    displayName,
    provisionalKind: provisionalKind(node),
    aliases: [],
    externalIds: [`neo4j:${id}`],
    attributes: attrs,
    evidenceSnippetIds: [],
    status: "accepted",
    createdAt: nowIso(),
  };
}

function mergeEntities(map: Map<string, EntityCandidate>, e: EntityCandidate): void {
  const prev = map.get(e.id);
  if (!prev) {
    map.set(e.id, e);
    return;
  }
  if (e.displayName.length > prev.displayName.length) {
    prev.displayName = e.displayName;
  }
  if (e.provisionalKind !== "entity" && prev.provisionalKind === "entity") {
    prev.provisionalKind = e.provisionalKind;
  }
  prev.attributes = { ...prev.attributes, ...e.attributes };
}

function buildSession(dumpPath: string, dump: DumpJson): ResearchSession {
  const records = dump.result?.records ?? [];
  const entityMap = new Map<string, EntityCandidate>();
  const relMap = new Map<string, RelationshipCandidate>();

  for (const row of records) {
    const n = row.n;
    const m = row.m;
    const r = row.r;
    if (!n || !m || !r) continue;
    const en = toEntity(n);
    const em = toEntity(m);
    if (!en || !em) continue;
    mergeEntities(entityMap, en);
    mergeEntities(entityMap, em);

    const rid = (r.id ?? "").trim();
    if (!rid) continue;
    if (!relMap.has(rid)) {
      relMap.set(rid, {
        id: rid,
        sourceEntityId: en.id,
        targetEntityId: em.id,
        verb: verbFromRel(r),
        confidence: "high",
        evidenceSnippetIds: [],
        status: "accepted",
      });
    }
  }

  const rels = [...relMap.values()];

  const iso = nowIso();
  const query = dump.query ?? "";

  return {
    id: IMPORT_SESSION_ID,
    title: "Neo4j dump.json import",
    seedQuery: query.slice(0, 2000),
    status: "ready",
    createdAt: iso,
    updatedAt: iso,
    messages: [],
    sources: [],
    evidenceSnippets: [],
    claims: [],
    entityCandidates: [...entityMap.values()],
    relationshipCandidates: rels,
    reviewDecisions: [],
    notes: [`Imported from ${path.relative(PRODUCT_ROOT, dumpPath)} at ${iso}`],
    events: [],
  };
}

async function main(): Promise<void> {
  const argvPath = process.argv[2]?.trim();
  const defaultPath = path.resolve(PRODUCT_ROOT, "..", "assets", "olddata", "dump.json");
  const dumpPath = path.resolve(argvPath || defaultPath);
  const raw = readFileSync(dumpPath, "utf8");
  const dump = JSON.parse(raw) as DumpJson;
  if (!dump.result?.records) {
    throw new Error(`Invalid dump: expected result.records in ${dumpPath}`);
  }

  const session = buildSession(dumpPath, dump);
  console.log(
    `Built session ${IMPORT_SESSION_ID}: ${session.entityCandidates.length} entities, ${session.relationshipCandidates.length} relationships (from ${dump.result.records.length} rows).`,
  );

  const persistence = getGraphPersistence();
  const result = await persistence.persistResearchSession(session, { includeDeferred: false });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
