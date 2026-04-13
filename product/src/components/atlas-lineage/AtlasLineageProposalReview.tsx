"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkspaceResponse } from "@/src/components/research-workbench-model";
import { fetchJson } from "@/src/components/research-workbench-utils";
import type { EntityCandidate, RelationshipCandidate, ResearchSession } from "@/src/types/research-session";

export type AtlasLineageProposalReviewProps = {
  session: ResearchSession | null;
  sessionId: string | null;
  onSessionUpdated: (s: ResearchSession) => void;
  onPublished?: () => void;
  onHighlightCandidate?: (id: string) => void;
};

type RenameKindResponse = WorkspaceResponse & { renamed?: number };

type PublishResponse = WorkspaceResponse & {
  result?: {
    entitiesUpserted: number;
    relationshipsUpserted: number;
  };
};

export function AtlasLineageProposalReview({
  session,
  sessionId,
  onSessionUpdated,
  onPublished,
  onHighlightCandidate,
}: AtlasLineageProposalReviewProps) {
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});
  const [renameBusyKind, setRenameBusyKind] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const proposedEntities = useMemo(
    () => session?.entityCandidates.filter((e) => e.status === "proposed") ?? [],
    [session],
  );

  const proposedRelationships = useMemo(
    () => session?.relationshipCandidates.filter((r) => r.status === "proposed") ?? [],
    [session],
  );

  const entityById = useMemo(() => {
    const m = new Map<string, EntityCandidate>();
    for (const e of session?.entityCandidates ?? []) {
      m.set(e.id, e);
    }
    return m;
  }, [session]);

  const kindRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of proposedEntities) {
      const k = e.provisionalKind.trim() || "(empty)";
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [proposedEntities]);

  useEffect(() => {
    setRenameDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const [kind] of kindRows) {
        next[kind] = prev[kind] ?? "";
      }
      return next;
    });
  }, [kindRows]);

  const applyRename = useCallback(
    async (from: string) => {
      if (!sessionId) return;
      const to = (renameDrafts[from] ?? "").trim();
      if (!to || to === from.trim()) {
        setRenameError("Enter a new kind name different from the current one.");
        return;
      }
      setRenameError(null);
      setRenameBusyKind(from);
      try {
        const data = await fetchJson<RenameKindResponse>(
          `/api/sessions/${encodeURIComponent(sessionId)}/candidates/rename-kind`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from, to }),
          },
        );
        onSessionUpdated(data.session);
        setRenameDrafts((prev) => ({ ...prev, [from]: "" }));
      } catch (err: unknown) {
        setRenameError(err instanceof Error ? err.message : "Rename failed.");
      } finally {
        setRenameBusyKind(null);
      }
    },
    [sessionId, renameDrafts, onSessionUpdated],
  );

  const publish = useCallback(async () => {
    if (!sessionId) return;
    setPublishError(null);
    setPublishBusy(true);
    try {
      const data = await fetchJson<PublishResponse>(
        `/api/sessions/${encodeURIComponent(sessionId)}/graph/publish`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      );
      onSessionUpdated(data.session);
      onPublished?.();
    } catch (err: unknown) {
      setPublishError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setPublishBusy(false);
    }
  }, [sessionId, onSessionUpdated, onPublished]);

  if (!session) {
    return null;
  }

  const hasProposals = proposedEntities.length > 0 || proposedRelationships.length > 0;

  return (
    <section className="gg-atlas-lineage__proposal-panel" aria-label="Proposal review">
      <h2 className="gg-atlas-lineage__proposal-title">Proposal review</h2>

      <div className="gg-atlas-lineage__proposal-block">
        <h3 className="gg-atlas-lineage__proposal-subtitle">Proposed kinds</h3>
        {kindRows.length === 0 ? (
          <p className="gg-atlas-lineage__proposal-muted">No proposed entity kinds.</p>
        ) : (
          <ul className="gg-atlas-lineage__proposal-kind-list">
            {kindRows.map(([kind, count], index) => (
              <li key={kind} className="gg-atlas-lineage__proposal-kind-row">
                <span className="gg-atlas-lineage__proposal-kind-label">
                  {kind} <span className="gg-atlas-lineage__proposal-count">({count})</span>
                </span>
                <label className="sr-only" htmlFor={`atlas-rename-kind-${index}`}>
                  Rename {kind} to
                </label>
                <input
                  id={`atlas-rename-kind-${index}`}
                  className="gg-atlas-lineage__proposal-input"
                  value={renameDrafts[kind] ?? ""}
                  onChange={(e) =>
                    setRenameDrafts((prev) => ({
                      ...prev,
                      [kind]: e.target.value,
                    }))
                  }
                  placeholder="Rename to…"
                  disabled={!sessionId || renameBusyKind !== null || publishBusy}
                />
                <button
                  type="button"
                  className="gg-atlas-lineage__btn-secondary gg-atlas-lineage__proposal-apply"
                  disabled={!sessionId || renameBusyKind !== null || publishBusy}
                  onClick={() => void applyRename(kind)}
                >
                  {renameBusyKind === kind ? "Applying…" : "Apply"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {renameError ? (
          <p className="gg-atlas-lineage__proposal-inline-error" role="alert">
            {renameError}
          </p>
        ) : null}
      </div>

      <div className="gg-atlas-lineage__proposal-block">
        <h3 className="gg-atlas-lineage__proposal-subtitle">Proposed instances</h3>
        {proposedEntities.length === 0 ? (
          <p className="gg-atlas-lineage__proposal-muted">No proposed entities.</p>
        ) : (
          <div className="gg-atlas-lineage__proposal-table-wrap">
            <table className="gg-atlas-lineage__proposal-table">
              <caption className="sr-only">Proposed entities</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Id</th>
                </tr>
              </thead>
              <tbody>
                {proposedEntities.map((e) => (
                  <tr
                    key={e.id}
                    className={onHighlightCandidate ? "gg-atlas-lineage__proposal-row--clickable" : undefined}
                    tabIndex={onHighlightCandidate ? 0 : undefined}
                    onKeyDown={
                      onHighlightCandidate
                        ? (ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              onHighlightCandidate(e.id);
                            }
                          }
                        : undefined
                    }
                    onClick={
                      onHighlightCandidate
                        ? () => {
                            onHighlightCandidate(e.id);
                          }
                        : undefined
                    }
                  >
                    <td>{e.displayName}</td>
                    <td>{e.provisionalKind}</td>
                    <td className="gg-atlas-lineage__proposal-mono">{e.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {proposedRelationships.length === 0 ? (
          <p className="gg-atlas-lineage__proposal-muted">No proposed relationships.</p>
        ) : (
          <div className="gg-atlas-lineage__proposal-table-wrap gg-atlas-lineage__proposal-table-wrap--spaced">
            <table className="gg-atlas-lineage__proposal-table">
              <caption className="sr-only">Proposed relationships</caption>
              <thead>
                <tr>
                  <th scope="col">Verb</th>
                  <th scope="col">Source</th>
                  <th scope="col">Target</th>
                </tr>
              </thead>
              <tbody>
                {proposedRelationships.map((r: RelationshipCandidate) => {
                  const src = entityById.get(r.sourceEntityId);
                  const tgt = entityById.get(r.targetEntityId);
                  const srcLabel = src?.displayName ?? r.sourceEntityId;
                  const tgtLabel = tgt?.displayName ?? r.targetEntityId;
                  return (
                    <tr
                      key={r.id}
                      className={onHighlightCandidate ? "gg-atlas-lineage__proposal-row--clickable" : undefined}
                      tabIndex={onHighlightCandidate ? 0 : undefined}
                      onKeyDown={
                        onHighlightCandidate
                          ? (ev) => {
                              if (ev.key === "Enter" || ev.key === " ") {
                                ev.preventDefault();
                                onHighlightCandidate(r.sourceEntityId);
                              }
                            }
                          : undefined
                      }
                      onClick={
                        onHighlightCandidate
                          ? () => {
                              onHighlightCandidate(r.sourceEntityId);
                            }
                          : undefined
                      }
                    >
                      <td>{r.verb}</td>
                      <td>{srcLabel}</td>
                      <td>{tgtLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="gg-atlas-lineage__proposal-actions">
        <button
          type="button"
          className="gg-atlas-lineage__btn-primary"
          disabled={!sessionId || !hasProposals || publishBusy}
          onClick={() => void publish()}
        >
          {publishBusy ? "Publishing…" : "Publish to TypeDB"}
        </button>
        {publishError ? (
          <p className="gg-atlas-lineage__proposal-inline-error" role="alert">
            {publishError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
