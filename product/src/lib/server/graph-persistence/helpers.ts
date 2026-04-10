import type { ResearchSession } from "@/src/types/research-session";
import type { GraphSyncSessionSnapshot } from "./types";

export function normalizeName(displayName: string): string {
  return displayName.trim().toLowerCase();
}

export function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function mergeStringLists(existing: unknown, incoming: string[]): string[] {
  const base = Array.isArray(existing) ? existing.filter((item): item is string => typeof item === "string") : [];
  return uniqueStrings([...base, ...incoming]);
}

export function mergeAttributes(
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

export function candidateKey(sessionId: string, candidateId: string): string {
  return `${sessionId}:${candidateId}`;
}

function countByStatus<T extends { status: string }>(items: T[], status: string): number {
  return items.filter((item) => item.status === status).length;
}

export function shouldSyncReviewStatus(status: string, includeDeferred: boolean): boolean {
  if (status === "accepted") {
    return true;
  }
  return includeDeferred && status === "deferred";
}

export function buildSessionSnapshot(session: ResearchSession): GraphSyncSessionSnapshot {
  return {
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
}

/** Safe single-quoted substring for Cypher hints (no injection; copy-paste only). */
function browserHintNeedle(session: ResearchSession): string {
  const raw = session.seedQuery.trim().toLowerCase();
  const token = raw.split(/\s+/).find((w) => w.length >= 2) ?? "entity";
  const safe = token.replace(/[^a-z0-9]/g, "").slice(0, 48);
  return safe.length >= 2 ? safe : "entity";
}

export function buildTypeDbSyncHint(
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

  const needle = browserHintNeedle(session);
  return `In TypeDB Studio or the console for database "${database}", query graph-entity instances (e.g. match by display-name containing related text). Example needle from seed query: "${needle}".`;
}

export function escapeTypeqlString(value: string): string {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
