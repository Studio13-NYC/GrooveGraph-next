"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkspaceResponse } from "@/src/components/research-workbench-model";
import { fetchJson, normalizeAliases } from "@/src/components/research-workbench-utils";
import { publishToDbProgressForElapsed } from "@/src/lib/research-turn-progress-ui";
import { isNovelProvisionalKind } from "@/src/lib/workbench-viz/graph-viz-styles";
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

type SessionPayload = { session: ResearchSession };

function IconPencil() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12zM10 11v6M14 11v6" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

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
  const [publishProgressTick, setPublishProgressTick] = useState(0);
  const publishStartedAtRef = useRef<number | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [rowBusyKey, setRowBusyKey] = useState<string | null>(null);

  const [entityEditingId, setEntityEditingId] = useState<string | null>(null);
  const [entityEditForm, setEntityEditForm] = useState({ displayName: "", provisionalKind: "", aliasesText: "" });

  const [relEditingId, setRelEditingId] = useState<string | null>(null);
  const [relEditVerb, setRelEditVerb] = useState("");

  /** Provisional kind string key (same as kindRows) being renamed via table row. */
  const [kindRowEditing, setKindRowEditing] = useState<string | null>(null);

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

  const novelKindRows = useMemo(
    () => kindRows.filter(([kind]) => isNovelProvisionalKind(kind)),
    [kindRows],
  );

  const representativeEntityIdByKind = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of proposedEntities) {
      const k = e.provisionalKind.trim() || "(empty)";
      if (!m.has(k)) {
        m.set(k, e.id);
      }
    }
    return m;
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

  useEffect(() => {
    if (kindRowEditing === null) {
      return;
    }
    if (!novelKindRows.some(([k]) => k === kindRowEditing)) {
      setKindRowEditing(null);
    }
  }, [kindRowEditing, novelKindRows]);

  useEffect(() => {
    if (!sessionId) {
      setEntityEditingId(null);
      setRelEditingId(null);
      setKindRowEditing(null);
      setRowError(null);
      setRowBusyKey(null);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!publishBusy) {
      publishStartedAtRef.current = null;
      return;
    }
    const id = window.setInterval(() => {
      setPublishProgressTick((n) => n + 1);
    }, 400);
    return () => window.clearInterval(id);
  }, [publishBusy]);

  const publishProgressUi = useMemo(() => {
    if (!publishBusy || publishStartedAtRef.current === null) {
      return null;
    }
    void publishProgressTick;
    return publishToDbProgressForElapsed(Date.now() - publishStartedAtRef.current);
  }, [publishBusy, publishProgressTick]);

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
        setKindRowEditing((cur) => (cur === from ? null : cur));
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
    publishStartedAtRef.current = Date.now();
    setPublishProgressTick(0);
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

  const rejectCandidate = useCallback(
    async (itemType: "entity" | "relationship", itemId: string, label: string) => {
      if (!sessionId) return;
      if (!window.confirm(`Remove “${label}” from proposals?`)) {
        return;
      }
      setRowError(null);
      const key = `rej-${itemType}-${itemId}`;
      setRowBusyKey(key);
      try {
        const data = await fetchJson<SessionPayload>(`/api/sessions/${encodeURIComponent(sessionId)}/decisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType, itemId, decision: "rejected" }),
        });
        onSessionUpdated(data.session);
        if (entityEditingId === itemId) {
          setEntityEditingId(null);
        }
        if (relEditingId === itemId) {
          setRelEditingId(null);
        }
      } catch (err: unknown) {
        setRowError(err instanceof Error ? err.message : "Could not remove item.");
      } finally {
        setRowBusyKey(null);
      }
    },
    [sessionId, onSessionUpdated, entityEditingId, relEditingId],
  );

  const saveEntityEdit = useCallback(async () => {
    if (!sessionId || !entityEditingId) return;
    const dn = entityEditForm.displayName.trim();
    const pk = entityEditForm.provisionalKind.trim();
    if (!dn || !pk) {
      setRowError("Name and kind are required.");
      return;
    }
    setRowError(null);
    const key = `save-ent-${entityEditingId}`;
    setRowBusyKey(key);
    try {
      const data = await fetchJson<WorkspaceResponse>(`/api/sessions/${encodeURIComponent(sessionId)}/candidates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateType: "entity",
          candidateId: entityEditingId,
          displayName: dn,
          provisionalKind: pk,
          aliases: normalizeAliases(entityEditForm.aliasesText.split(",")),
        }),
      });
      onSessionUpdated(data.session);
      setEntityEditingId(null);
    } catch (err: unknown) {
      setRowError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setRowBusyKey(null);
    }
  }, [sessionId, entityEditingId, entityEditForm, onSessionUpdated]);

  const saveRelEdit = useCallback(async () => {
    if (!sessionId || !relEditingId) return;
    const v = relEditVerb.trim();
    if (!v) {
      setRowError("Relationship verb is required.");
      return;
    }
    setRowError(null);
    const key = `save-rel-${relEditingId}`;
    setRowBusyKey(key);
    try {
      const data = await fetchJson<WorkspaceResponse>(`/api/sessions/${encodeURIComponent(sessionId)}/candidates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateType: "relationship",
          candidateId: relEditingId,
          verb: v,
        }),
      });
      onSessionUpdated(data.session);
      setRelEditingId(null);
    } catch (err: unknown) {
      setRowError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setRowBusyKey(null);
    }
  }, [sessionId, relEditingId, relEditVerb, onSessionUpdated]);

  const startEntityEdit = useCallback((e: EntityCandidate) => {
    setRowError(null);
    setEntityEditingId(e.id);
    setEntityEditForm({
      displayName: e.displayName,
      provisionalKind: e.provisionalKind,
      aliasesText: e.aliases.join(", "),
    });
  }, []);

  const startRelEdit = useCallback((r: RelationshipCandidate) => {
    setRowError(null);
    setRelEditingId(r.id);
    setRelEditVerb(r.verb);
  }, []);

  const startKindRowEdit = useCallback((kind: string) => {
    setRowError(null);
    setRenameError(null);
    setKindRowEditing(kind);
  }, []);

  const rejectAllProposedOfKind = useCallback(
    async (kindKey: string) => {
      if (!sessionId) {
        return;
      }
      const targets = proposedEntities.filter((e) => (e.provisionalKind.trim() || "(empty)") === kindKey);
      if (targets.length === 0) {
        return;
      }
      if (
        !window.confirm(
          `Remove ${targets.length} proposed entit${targets.length === 1 ? "y" : "ies"} with type “${kindKey}”?`,
        )
      ) {
        return;
      }
      setRowError(null);
      setRowBusyKey(`reject-kind-${kindKey}`);
      try {
        for (const e of targets) {
          const data = await fetchJson<SessionPayload>(`/api/sessions/${encodeURIComponent(sessionId)}/decisions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemType: "entity", itemId: e.id, decision: "rejected" }),
          });
          onSessionUpdated(data.session);
          if (entityEditingId === e.id) {
            setEntityEditingId(null);
          }
        }
        setKindRowEditing((cur) => (cur === kindKey ? null : cur));
      } catch (err: unknown) {
        setRowError(err instanceof Error ? err.message : "Could not remove entities for this type.");
      } finally {
        setRowBusyKey(null);
      }
    },
    [sessionId, proposedEntities, onSessionUpdated, entityEditingId],
  );

  const rowBusy = rowBusyKey !== null;
  const kindTableLocksUi = kindRowEditing !== null;

  if (!session) {
    return null;
  }

  const hasProposals = proposedEntities.length > 0 || proposedRelationships.length > 0;

  return (
    <section className="gg-atlas-lineage__proposal-panel" aria-label="Proposal review">
      <h2 className="gg-atlas-lineage__proposal-title">Proposal review</h2>

      {novelKindRows.length > 0 ? (
        <div className="gg-atlas-lineage__proposal-block">
          <h3 className="gg-atlas-lineage__proposal-subtitle">Proposed new types</h3>
          <p className="gg-atlas-lineage__proposal-muted gg-atlas-lineage__proposal-block-hint">
            Unfamiliar provisional kinds only. Rename to match your schema (e.g. person, album), or remove all
            proposed entities that use this label.
          </p>
          <div className="gg-atlas-lineage__proposal-table-wrap">
            <table className="gg-atlas-lineage__proposal-table">
              <caption className="sr-only">Proposed new entity types</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Type</th>
                  <th scope="col">Id</th>
                  <th scope="col" className="gg-atlas-lineage__proposal-th-actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {novelKindRows.map(([kind, count]) => {
                  const editing = kindRowEditing === kind;
                  const repId = representativeEntityIdByKind.get(kind) ?? "—";
                  const idShort = repId.length > 22 ? `${repId.slice(0, 22)}…` : repId;
                  const kindBusy = renameBusyKind === kind;
                  const rejectKindBusy = rowBusyKey === `reject-kind-${kind}`;
                  const busyThis = kindBusy || rejectKindBusy;
                  const anotherKindRowEditing = kindRowEditing !== null && kindRowEditing !== kind;
                  return (
                    <tr
                      key={kind}
                      className={editing ? "gg-atlas-lineage__proposal-row--active" : undefined}
                    >
                      <td>
                        {editing ? (
                          <input
                            className="gg-atlas-lineage__proposal-cell-input"
                            value={renameDrafts[kind] ?? ""}
                            onChange={(ev) =>
                              setRenameDrafts((prev) => ({
                                ...prev,
                                [kind]: ev.target.value,
                              }))
                            }
                            placeholder="Rename to…"
                            aria-label={`Rename type ${kind} to`}
                            disabled={busyThis || publishBusy}
                          />
                        ) : (
                          <>
                            {kind}{" "}
                            <span className="gg-atlas-lineage__proposal-count">({count})</span>
                          </>
                        )}
                      </td>
                      <td>
                        <span className="gg-atlas-lineage__proposal-row-mini">New type</span>
                      </td>
                      <td className="gg-atlas-lineage__proposal-mono" title={repId}>
                        {idShort}
                      </td>
                      <td>
                        <div
                          className={
                            editing
                              ? "gg-atlas-lineage__proposal-row-actions gg-atlas-lineage__proposal-row-actions--edit"
                              : "gg-atlas-lineage__proposal-row-actions"
                          }
                        >
                          {editing ? (
                            <>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn"
                                title="Apply rename"
                                aria-label={`Apply rename for type ${kind}`}
                                disabled={
                                  !sessionId || busyThis || publishBusy || entityEditingId !== null || relEditingId !== null
                                }
                                onClick={() => void applyRename(kind)}
                              >
                                {kindBusy ? <span aria-hidden>…</span> : <IconCheck />}
                              </button>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn"
                                title="Cancel"
                                aria-label="Cancel rename"
                                disabled={busyThis || publishBusy}
                                onClick={() => setKindRowEditing(null)}
                              >
                                <IconX />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn"
                                title="Rename type"
                                aria-label={`Rename type ${kind}`}
                                disabled={
                                  !sessionId ||
                                  renameBusyKind !== null ||
                                  publishBusy ||
                                  rowBusy ||
                                  entityEditingId !== null ||
                                  relEditingId !== null ||
                                  anotherKindRowEditing
                                }
                                onClick={() => startKindRowEdit(kind)}
                              >
                                <IconPencil />
                              </button>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn gg-atlas-lineage__proposal-icon-btn--danger"
                                title="Remove all proposed entities with this type"
                                aria-label={`Remove all entities with type ${kind}`}
                                disabled={
                                  !sessionId ||
                                  renameBusyKind !== null ||
                                  publishBusy ||
                                  rowBusy ||
                                  entityEditingId !== null ||
                                  relEditingId !== null ||
                                  anotherKindRowEditing
                                }
                                onClick={() => void rejectAllProposedOfKind(kind)}
                              >
                                <IconTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {renameError ? (
            <p className="gg-atlas-lineage__proposal-inline-error" role="alert">
              {renameError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="gg-atlas-lineage__proposal-block">
        <h3 className="gg-atlas-lineage__proposal-subtitle">Proposed instances</h3>
        {rowError ? (
          <p className="gg-atlas-lineage__proposal-inline-error" role="alert">
            {rowError}
          </p>
        ) : null}
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
                  <th scope="col">Id / aliases</th>
                  <th scope="col" className="gg-atlas-lineage__proposal-th-actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {proposedEntities.map((e) => {
                  const editing = entityEditingId === e.id;
                  const entityBusyKey =
                    rowBusyKey === `rej-entity-${e.id}` || rowBusyKey === `save-ent-${e.id}`;
                  const busyThis = entityBusyKey;
                  const anotherEntityEditing =
                    (entityEditingId !== null && entityEditingId !== e.id) || kindTableLocksUi;
                  return (
                    <tr
                      key={e.id}
                      className={[
                        onHighlightCandidate && !editing ? "gg-atlas-lineage__proposal-row--clickable" : "",
                        editing ? "gg-atlas-lineage__proposal-row--active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined}
                      tabIndex={onHighlightCandidate && !editing ? 0 : undefined}
                      onKeyDown={
                        onHighlightCandidate && !editing
                          ? (ev) => {
                              if (ev.key === "Enter" || ev.key === " ") {
                                ev.preventDefault();
                                onHighlightCandidate(e.id);
                              }
                            }
                          : undefined
                      }
                      onClick={
                        onHighlightCandidate && !editing
                          ? () => {
                              onHighlightCandidate(e.id);
                            }
                          : undefined
                      }
                    >
                      <td>
                        {editing ? (
                          <input
                            className="gg-atlas-lineage__proposal-cell-input"
                            value={entityEditForm.displayName}
                            onChange={(ev) =>
                              setEntityEditForm((f) => ({ ...f, displayName: ev.target.value }))
                            }
                            aria-label="Display name"
                            onClick={(ev) => ev.stopPropagation()}
                          />
                        ) : (
                          e.displayName
                        )}
                      </td>
                      <td>
                        {editing ? (
                          <input
                            className="gg-atlas-lineage__proposal-cell-input"
                            value={entityEditForm.provisionalKind}
                            onChange={(ev) =>
                              setEntityEditForm((f) => ({ ...f, provisionalKind: ev.target.value }))
                            }
                            aria-label="Provisional kind"
                            onClick={(ev) => ev.stopPropagation()}
                          />
                        ) : (
                          e.provisionalKind
                        )}
                      </td>
                      <td className="gg-atlas-lineage__proposal-mono" title={e.id}>
                        {editing ? (
                          <input
                            className="gg-atlas-lineage__proposal-cell-input"
                            value={entityEditForm.aliasesText}
                            onChange={(ev) =>
                              setEntityEditForm((f) => ({ ...f, aliasesText: ev.target.value }))
                            }
                            placeholder="Aliases, comma-separated"
                            aria-label="Aliases"
                            onClick={(ev) => ev.stopPropagation()}
                          />
                        ) : (
                          e.id.slice(0, 18) + (e.id.length > 18 ? "…" : "")
                        )}
                      </td>
                      <td onClick={(ev) => ev.stopPropagation()}>
                        <div
                          className={
                            editing
                              ? "gg-atlas-lineage__proposal-row-actions gg-atlas-lineage__proposal-row-actions--edit"
                              : "gg-atlas-lineage__proposal-row-actions"
                          }
                        >
                          {editing ? (
                            <>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn"
                                title="Save"
                                aria-label="Save entity"
                                disabled={busyThis || publishBusy || kindTableLocksUi}
                                onClick={() => void saveEntityEdit()}
                              >
                                <IconCheck />
                              </button>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn"
                                title="Cancel"
                                aria-label="Cancel edit"
                                disabled={busyThis || publishBusy || kindTableLocksUi}
                                onClick={() => setEntityEditingId(null)}
                              >
                                <IconX />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn"
                                title="Edit"
                                aria-label={`Edit ${e.displayName}`}
                                disabled={
                                  busyThis ||
                                  publishBusy ||
                                  relEditingId !== null ||
                                  anotherEntityEditing ||
                                  renameBusyKind !== null
                                }
                                onClick={() => startEntityEdit(e)}
                              >
                                <IconPencil />
                              </button>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn gg-atlas-lineage__proposal-icon-btn--danger"
                                title="Remove from proposals"
                                aria-label={`Remove ${e.displayName}`}
                                disabled={
                                  busyThis ||
                                  publishBusy ||
                                  relEditingId !== null ||
                                  anotherEntityEditing ||
                                  renameBusyKind !== null
                                }
                                onClick={() => void rejectCandidate("entity", e.id, e.displayName)}
                              >
                                <IconTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                  <th scope="col" className="gg-atlas-lineage__proposal-th-actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {proposedRelationships.map((r: RelationshipCandidate) => {
                  const src = entityById.get(r.sourceEntityId);
                  const tgt = entityById.get(r.targetEntityId);
                  const srcLabel = src?.displayName ?? r.sourceEntityId;
                  const tgtLabel = tgt?.displayName ?? r.targetEntityId;
                  const editing = relEditingId === r.id;
                  const relBusyKey =
                    rowBusyKey === `rej-relationship-${r.id}` || rowBusyKey === `save-rel-${r.id}`;
                  const busyThis = relBusyKey;
                  const anotherRelEditing =
                    (relEditingId !== null && relEditingId !== r.id) || kindTableLocksUi;
                  const relLabel = `${r.verb}: ${srcLabel} → ${tgtLabel}`;
                  return (
                    <tr
                      key={r.id}
                      className={[
                        onHighlightCandidate && !editing ? "gg-atlas-lineage__proposal-row--clickable" : "",
                        editing ? "gg-atlas-lineage__proposal-row--active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined}
                      tabIndex={onHighlightCandidate && !editing ? 0 : undefined}
                      onKeyDown={
                        onHighlightCandidate && !editing
                          ? (ev) => {
                              if (ev.key === "Enter" || ev.key === " ") {
                                ev.preventDefault();
                                onHighlightCandidate(r.sourceEntityId);
                              }
                            }
                          : undefined
                      }
                      onClick={
                        onHighlightCandidate && !editing
                          ? () => {
                              onHighlightCandidate(r.sourceEntityId);
                            }
                          : undefined
                      }
                    >
                      <td>
                        {editing ? (
                          <input
                            className="gg-atlas-lineage__proposal-cell-input"
                            value={relEditVerb}
                            onChange={(ev) => setRelEditVerb(ev.target.value)}
                            aria-label="Relationship verb"
                            onClick={(ev) => ev.stopPropagation()}
                          />
                        ) : (
                          r.verb
                        )}
                      </td>
                      <td>{srcLabel}</td>
                      <td>{tgtLabel}</td>
                      <td onClick={(ev) => ev.stopPropagation()}>
                        <div
                          className={
                            editing
                              ? "gg-atlas-lineage__proposal-row-actions gg-atlas-lineage__proposal-row-actions--edit"
                              : "gg-atlas-lineage__proposal-row-actions"
                          }
                        >
                          {editing ? (
                            <>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn"
                                title="Save"
                                aria-label="Save relationship"
                                disabled={busyThis || publishBusy || kindTableLocksUi}
                                onClick={() => void saveRelEdit()}
                              >
                                <IconCheck />
                              </button>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn"
                                title="Cancel"
                                aria-label="Cancel edit"
                                disabled={busyThis || publishBusy || kindTableLocksUi}
                                onClick={() => setRelEditingId(null)}
                              >
                                <IconX />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn"
                                title="Edit verb"
                                aria-label={`Edit ${relLabel}`}
                                disabled={
                                  busyThis ||
                                  publishBusy ||
                                  entityEditingId !== null ||
                                  anotherRelEditing ||
                                  renameBusyKind !== null
                                }
                                onClick={() => startRelEdit(r)}
                              >
                                <IconPencil />
                              </button>
                              <button
                                type="button"
                                className="gg-atlas-lineage__proposal-icon-btn gg-atlas-lineage__proposal-icon-btn--danger"
                                title="Remove from proposals"
                                aria-label={`Remove ${relLabel}`}
                                disabled={
                                  busyThis ||
                                  publishBusy ||
                                  entityEditingId !== null ||
                                  anotherRelEditing ||
                                  renameBusyKind !== null
                                }
                                onClick={() => void rejectCandidate("relationship", r.id, relLabel)}
                              >
                                <IconTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="gg-atlas-lineage__proposal-actions">
        {publishProgressUi ? (
          <div
            className="gg-atlas-lineage__proposal-publish-progress"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <p className="gg-atlas-lineage__proposal-publish-progress-title">{publishProgressUi.phaseLabel}</p>
            <p className="gg-atlas-lineage__proposal-publish-progress-detail">{publishProgressUi.detailLine}</p>
            <p className="gg-atlas-lineage__proposal-publish-progress-eta">{publishProgressUi.etaLine}</p>
          </div>
        ) : null}
        <button
          type="button"
          className="gg-atlas-lineage__btn-primary"
          disabled={!sessionId || !hasProposals || publishBusy || rowBusy || kindTableLocksUi}
          onClick={() => void publish()}
        >
          {publishBusy && publishProgressUi ? `${publishProgressUi.phaseLabel}…` : publishBusy ? "Publishing…" : "Publish to TypeDB"}
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
