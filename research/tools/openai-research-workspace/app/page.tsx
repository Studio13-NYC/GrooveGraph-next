"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  EntityCandidate,
  ResearchSession,
  RelationshipCandidate,
  ReviewDecisionRequest,
  UpdateGraphCandidateRequest,
} from "@/src/types/research-session";

type WorkspaceResponse = {
  session: ResearchSession;
};

type TripletCandidate = {
  relationship: RelationshipCandidate;
  sourceEntity: EntityCandidate | null;
  targetEntity: EntityCandidate | null;
};

type EntityEditDraft = {
  candidateId: string;
  displayName: string;
  provisionalKind: string;
  aliases: string[];
};

type TripletEditDraft = {
  relationshipId: string;
  relationshipVerb: string;
  sourceEntity: EntityEditDraft | null;
  targetEntity: EntityEditDraft | null;
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }

  return data;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeAliases(aliases: string[]): string[] {
  const cleaned = aliases
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);
  return [...new Set(cleaned)];
}

export default function HomePage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [seedQuery, setSeedQuery] = useState("Prince");
  const [message, setMessage] = useState("");
  const [tripletEditDraft, setTripletEditDraft] = useState<TripletEditDraft | null>(null);
  const [savingTripletId, setSavingTripletId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leftColumnFraction, setLeftColumnFraction] = useState(0.6);
  const [isMainGridResizing, setIsMainGridResizing] = useState(false);
  const [isNarrowWorkspaceLayout, setIsNarrowWorkspaceLayout] = useState(false);
  const latestAssistantMessageRef = useRef<HTMLElement | null>(null);
  const mainGridRef = useRef<HTMLElement | null>(null);
  const splitDragStateRef = useRef<{
    startX: number;
    startFraction: number;
    gridWidth: number;
  } | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  const tripletCandidates = useMemo<TripletCandidate[]>(() => {
    if (!selectedSession) {
      return [];
    }

    const entitiesById = new Map(
      selectedSession.entityCandidates.map((entity) => [entity.id, entity]),
    );

    return selectedSession.relationshipCandidates.map((relationship) => ({
      relationship,
      sourceEntity: entitiesById.get(relationship.sourceEntityId) ?? null,
      targetEntity: entitiesById.get(relationship.targetEntityId) ?? null,
    }));
  }, [selectedSession]);

  const availableKindLabels = useMemo(() => {
    if (!selectedSession) {
      return [];
    }

    return [...new Set(selectedSession.entityCandidates.map((entity) => entity.provisionalKind))].sort(
      (left, right) => left.localeCompare(right),
    );
  }, [selectedSession]);

  async function refreshSessions(nextSelectedSessionId?: string | null) {
    const data = await fetchJson<{ sessions: ResearchSession[] }>("/api/sessions");
    setSessions(data.sessions);
    if (nextSelectedSessionId) {
      setSelectedSessionId(nextSelectedSessionId);
    } else if (!selectedSessionId && data.sessions[0]) {
      setSelectedSessionId(data.sessions[0].id);
    }
  }

  useEffect(() => {
    void refreshSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTripletEditDraft(null);
  }, [selectedSessionId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 980px)");
    const syncLayoutMode = () => setIsNarrowWorkspaceLayout(mediaQuery.matches);
    syncLayoutMode();
    mediaQuery.addEventListener("change", syncLayoutMode);
    return () => mediaQuery.removeEventListener("change", syncLayoutMode);
  }, []);

  useEffect(() => {
    if (!isMainGridResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = splitDragStateRef.current;
      if (!dragState || dragState.gridWidth <= 0) {
        return;
      }

      const deltaFraction = (event.clientX - dragState.startX) / dragState.gridWidth;
      setLeftColumnFraction(clamp(dragState.startFraction + deltaFraction, 0.33, 0.72));
    };

    const stopResizing = () => {
      splitDragStateRef.current = null;
      setIsMainGridResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isMainGridResizing]);

  async function createSession() {
    setError(null);
    setIsBusy(true);
    try {
      const data = await fetchJson<WorkspaceResponse>("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seedQuery }),
      });
      await refreshSessions(data.session.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create session.");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendTurn() {
    if (!selectedSession || !message.trim()) {
      return;
    }

    setError(null);
    setIsBusy(true);
    try {
      const data = await fetchJson<WorkspaceResponse>(`/api/sessions/${selectedSession.id}/turn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      setSessions((current) =>
        current.map((session) => (session.id === data.session.id ? data.session : session)),
      );
      setMessage("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Turn failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function recordDecision(request: ReviewDecisionRequest) {
    if (!selectedSession) {
      return;
    }

    setError(null);
    try {
      const data = await fetchJson<WorkspaceResponse>(
        `/api/sessions/${selectedSession.id}/decisions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );

      setSessions((current) =>
        current.map((session) => (session.id === data.session.id ? data.session : session)),
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Decision failed.");
    }
  }

  async function updateGraphCandidate(request: UpdateGraphCandidateRequest): Promise<boolean> {
    if (!selectedSession) {
      return false;
    }

    setError(null);
    try {
      const data = await fetchJson<WorkspaceResponse>(
        `/api/sessions/${selectedSession.id}/candidates`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );

      setSessions((current) =>
        current.map((session) => (session.id === data.session.id ? data.session : session)),
      );
      return true;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Candidate update failed.");
      return false;
    }
  }

  function beginTripletEdit(
    relationship: RelationshipCandidate,
    sourceEntity: EntityCandidate | null,
    targetEntity: EntityCandidate | null,
  ) {
    setTripletEditDraft({
      relationshipId: relationship.id,
      relationshipVerb: relationship.verb,
      sourceEntity: sourceEntity
        ? {
            candidateId: sourceEntity.id,
            displayName: sourceEntity.displayName,
            provisionalKind: sourceEntity.provisionalKind,
            aliases: [...sourceEntity.aliases],
          }
        : null,
      targetEntity: targetEntity
        ? {
            candidateId: targetEntity.id,
            displayName: targetEntity.displayName,
            provisionalKind: targetEntity.provisionalKind,
            aliases: [...targetEntity.aliases],
          }
        : null,
    });
  }

  function beginMainGridResize(event: React.PointerEvent<HTMLElement>) {
    if (isNarrowWorkspaceLayout || !mainGridRef.current) {
      return;
    }

    const gridWidth = mainGridRef.current.getBoundingClientRect().width;
    if (gridWidth <= 0) {
      return;
    }

    splitDragStateRef.current = {
      startX: event.clientX,
      startFraction: leftColumnFraction,
      gridWidth,
    };
    setIsMainGridResizing(true);
  }

  function updateTripletEntityDraft(
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    field: "displayName" | "provisionalKind",
    value: string,
  ) {
    setTripletEditDraft((current) => {
      if (current?.relationshipId !== relationshipId) {
        return current;
      }

      const entityDraft = current[side];
      if (!entityDraft) {
        return current;
      }

      return {
        ...current,
        [side]: {
          ...entityDraft,
          [field]: value,
        },
      };
    });
  }

  function updateTripletEntityAlias(
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    aliasIndex: number,
    value: string,
  ) {
    setTripletEditDraft((current) => {
      if (current?.relationshipId !== relationshipId) {
        return current;
      }

      const entityDraft = current[side];
      if (!entityDraft) {
        return current;
      }

      return {
        ...current,
        [side]: {
          ...entityDraft,
          aliases: entityDraft.aliases.map((alias, index) =>
            index === aliasIndex ? value : alias,
          ),
        },
      };
    });
  }

  function addTripletEntityAlias(
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    value: string,
  ) {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    setTripletEditDraft((current) => {
      if (current?.relationshipId !== relationshipId) {
        return current;
      }

      const entityDraft = current[side];
      if (!entityDraft) {
        return current;
      }

      return {
        ...current,
        [side]: {
          ...entityDraft,
          aliases: [...entityDraft.aliases, trimmedValue],
        },
      };
    });
  }

  function removeTripletEntityAlias(
    relationshipId: string,
    side: "sourceEntity" | "targetEntity",
    aliasIndex: number,
  ) {
    setTripletEditDraft((current) => {
      if (current?.relationshipId !== relationshipId) {
        return current;
      }

      const entityDraft = current[side];
      if (!entityDraft) {
        return current;
      }

      return {
        ...current,
        [side]: {
          ...entityDraft,
          aliases: entityDraft.aliases.filter((_, index) => index !== aliasIndex),
        },
      };
    });
  }

  async function saveTripletEdit(relationshipId: string) {
    if (savingTripletId || tripletEditDraft?.relationshipId !== relationshipId) {
      return;
    }

    const draft = tripletEditDraft;
    const verb = draft.relationshipVerb.trim() || "related to";
    const updates: UpdateGraphCandidateRequest[] = [
      {
        candidateType: "relationship",
        candidateId: relationshipId,
        verb,
      },
    ];

    if (draft.sourceEntity) {
      updates.push({
        candidateType: "entity",
        candidateId: draft.sourceEntity.candidateId,
        displayName: draft.sourceEntity.displayName.trim() || "Unnamed entity",
        provisionalKind: draft.sourceEntity.provisionalKind.trim() || "Unknown",
        aliases: normalizeAliases(draft.sourceEntity.aliases),
      });
    }

    if (draft.targetEntity) {
      updates.push({
        candidateType: "entity",
        candidateId: draft.targetEntity.candidateId,
        displayName: draft.targetEntity.displayName.trim() || "Unnamed entity",
        provisionalKind: draft.targetEntity.provisionalKind.trim() || "Unknown",
        aliases: normalizeAliases(draft.targetEntity.aliases),
      });
    }

    setSavingTripletId(relationshipId);
    let allSaved = true;
    for (const request of updates) {
      const didSave = await updateGraphCandidate(request);
      if (!didSave) {
        allSaved = false;
      }
    }
    setSavingTripletId(null);

    if (allSaved) {
      setTripletEditDraft(null);
    }
  }

  const latestAssistantMessageId = useMemo(() => {
    if (!selectedSession) {
      return null;
    }

    const latestAssistant = [...selectedSession.messages]
      .reverse()
      .find((entry) => entry.role === "assistant");
    return latestAssistant?.id ?? null;
  }, [selectedSession]);

  const headerTitle = "GROOVEGRAPH / RESEARCH WORKBENCH";
  const headerSubtitle = selectedSession
    ? `${selectedSession.title} / Updated ${formatTimestamp(selectedSession.updatedAt)}`
    : "Select a past session or create a new route to begin investigating.";

  return (
    <main className="workspace-page">
      <section className="workspace-shell">
        <header className="workspace-header">
          <div className="workspace-header-band">
            <div className="workspace-header-identity">
              <span className="workspace-system-label">Current Session</span>
              <h1 className="workspace-active-title">{headerTitle}</h1>
              <p className="workspace-active-subtitle">{headerSubtitle}</p>
            </div>
            <div className="workspace-header-controls">
              <section className="header-control-plate">
                <label className="header-control-field">
                  <span className="header-control-label">New Session</span>
                  <input
                    value={seedQuery}
                    onChange={(event) => setSeedQuery(event.target.value)}
                    placeholder="Artist, URL, or question"
                    className="header-control-input"
                  />
                </label>
                <button
                  onClick={() => void createSession()}
                  disabled={isBusy}
                  className="primary-route-button"
                >
                  {isBusy ? "Working..." : "Create Session"}
                </button>
              </section>

              <section className="header-control-plate header-session-plate">
                <strong className="header-control-label">Past Sessions</strong>
                <div className="session-select-list">
                  {sessions.length === 0 ? (
                    <EmptyState text="No sessions yet." />
                  ) : (
                    sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`session-select-button${
                          selectedSessionId === session.id ? " session-select-button-active" : ""
                        }`}
                      >
                        <strong>{session.title}</strong>
                        <span>{formatTimestamp(session.updatedAt)}</span>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>

          {error ? <div className="workspace-error-banner">{error}</div> : null}
        </header>

        <section
          className="workspace-main-grid"
          ref={mainGridRef}
          style={{
            display: "grid",
            gridTemplateColumns: isNarrowWorkspaceLayout
              ? "minmax(0, 1fr)"
              : `minmax(0, ${leftColumnFraction}fr) 10px minmax(0, ${1 - leftColumnFraction}fr)`,
            gap: "16px",
            alignItems: "start",
          }}
        >
          <div className="workspace-lane">
            <LaneSection
              label="Research Route"
              title="Investigation"
              railColor="var(--route-orange)"
            >
              {selectedSession ? (
                <div className="investigation-stack">
                  <div className="message-stream">
                    {selectedSession.messages.length === 0 ? (
                      <EmptyState text="Send a message to start the artist-seed investigation." />
                    ) : (
                      selectedSession.messages.map((entry) => (
                        <article
                          key={entry.id}
                          ref={
                            entry.id === latestAssistantMessageId && entry.role === "assistant"
                              ? latestAssistantMessageRef
                              : undefined
                          }
                          className={`message-card message-card-${entry.role}`}
                        >
                          <div className="message-card-header">
                            <strong>{entry.role}</strong>
                            <span>{formatTimestamp(entry.createdAt)}</span>
                          </div>
                          <MarkdownMessage content={entry.content} />
                        </article>
                      ))
                    )}
                  </div>
                  <div className="composer-block">
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Ask a discovery question, refine the investigation, or request more evidence."
                      rows={3}
                      className="composer-input"
                    />
                    <button
                      onClick={() => void sendTurn()}
                      disabled={isBusy}
                      className="primary-route-button composer-submit"
                    >
                      {isBusy ? "Running Research..." : "Send Turn"}
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState text="Select or create a session to begin investigating." />
              )}
            </LaneSection>

            <LaneSection
              label="Informational Support"
              title="Evidence Support"
              railColor="var(--route-blue)"
            >
              <div className="support-stack">
                <section className="support-subsection">
                  <div className="support-subsection-header">
                    <strong>Field Notes</strong>
                    <span className="support-count">{selectedSession?.notes.length ?? 0}</span>
                  </div>
                  {selectedSession?.notes.length ? (
                    <ul className="support-list">
                      {selectedSession.notes.map((note, index) => (
                        <li key={`${note}-${index}`}>{note}</li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState text="Notes recorded by the model will appear here." />
                  )}
                </section>

                <details className="support-details">
                  <summary className="support-details-summary">
                    <span>Sources</span>
                    <span className="support-count">{selectedSession?.sources.length ?? 0}</span>
                  </summary>
                  <div className="support-details-body">
                    {selectedSession?.sources.length ? (
                      <div className="support-source-list">
                        {selectedSession.sources.map((source) => (
                          <article key={source.id} className="support-source-card">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="support-source-title"
                            >
                              {source.title}
                            </a>
                            <p className="support-source-url">{source.url}</p>
                            {source.citationText ? (
                              <p className="support-source-citation">{source.citationText}</p>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="Cited sources will appear here once the model searches the web." />
                    )}
                  </div>
                </details>
              </div>
            </LaneSection>
          </div>

          {!isNarrowWorkspaceLayout ? (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize workspace columns"
              tabIndex={-1}
              className={`workspace-splitter workspace-interchange${
                isMainGridResizing ? " workspace-splitter-active" : ""
              }`}
              onPointerDown={beginMainGridResize}
            >
              <span className="workspace-interchange-line workspace-interchange-line-top" aria-hidden />
              <span className="workspace-interchange-core" aria-hidden>
                <span className="workspace-interchange-ring" />
                <span className="workspace-interchange-crossbar" />
              </span>
              <span className="workspace-interchange-label" aria-hidden>
                Interchange
              </span>
              <span className="workspace-interchange-line workspace-interchange-line-bottom" aria-hidden />
              <span className="workspace-splitter-grip" aria-hidden />
            </div>
          ) : null}

          <div className="workspace-lane">
            <LaneSection
              label="Decision Route"
              title="Graph Review"
              railColor="var(--route-magenta)"
            >
              {selectedSession ? (
                <div className="review-stack">
                  {tripletCandidates.length ? (
                    tripletCandidates.map(({ relationship, sourceEntity, targetEntity }) => {
                      const isEditingTriplet = tripletEditDraft?.relationshipId === relationship.id;
                      const isSavingTriplet = savingTripletId === relationship.id;
                      const sourceDisplay = sourceEntity
                        ? sourceEntity.displayName
                        : `Missing source (${relationship.sourceEntityId})`;
                      const sourceKind = sourceEntity?.provisionalKind ?? "Unresolved entity";
                      const targetDisplay = targetEntity
                        ? targetEntity.displayName
                        : `Missing object (${relationship.targetEntityId})`;
                      const targetKind = targetEntity?.provisionalKind ?? "Unresolved entity";
                      const relationshipVerb = isEditingTriplet
                        ? tripletEditDraft?.relationshipVerb || "related to"
                        : relationship.verb;

                      return (
                        <article
                          key={relationship.id}
                          className="triplet-card"
                        >
                          <div className="triplet-card-header">
                            <StatusBar status={relationship.status} />
                            <span className="review-confidence-label">
                              confidence: {relationship.confidence}
                            </span>
                          </div>

                          <div className="triplet-proposition">
                            <TripletEntitySummary
                              align="start"
                              displayName={sourceDisplay}
                              kind={sourceKind}
                              entity={sourceEntity}
                              danglingId={relationship.sourceEntityId}
                              isEditing={isEditingTriplet}
                              editDraft={isEditingTriplet ? tripletEditDraft?.sourceEntity ?? null : null}
                              kindOptions={availableKindLabels}
                              onUpdateDraft={(field, value) =>
                                updateTripletEntityDraft(relationship.id, "sourceEntity", field, value)
                              }
                              onUpdateAlias={(aliasIndex, value) =>
                                updateTripletEntityAlias(
                                  relationship.id,
                                  "sourceEntity",
                                  aliasIndex,
                                  value,
                                )
                              }
                              onAddAlias={(value) =>
                                addTripletEntityAlias(relationship.id, "sourceEntity", value)
                              }
                              onRemoveAlias={(aliasIndex) =>
                                removeTripletEntityAlias(
                                  relationship.id,
                                  "sourceEntity",
                                  aliasIndex,
                                )
                              }
                            />
                            {isEditingTriplet ? (
                              <input
                                value={tripletEditDraft?.relationshipVerb ?? relationship.verb}
                                onChange={(event) =>
                                  setTripletEditDraft((current) =>
                                    current?.relationshipId === relationship.id
                                      ? {
                                          ...current,
                                          relationshipVerb: event.target.value,
                                        }
                                      : current,
                                  )
                                }
                                disabled={isSavingTriplet}
                                className="triplet-verb triplet-inline-input triplet-inline-verb-input"
                                aria-label="Relationship verb"
                              />
                            ) : (
                              <span className="triplet-verb">{relationshipVerb}</span>
                            )}
                            <TripletEntitySummary
                              align="end"
                              displayName={targetDisplay}
                              kind={targetKind}
                              entity={targetEntity}
                              danglingId={relationship.targetEntityId}
                              isEditing={isEditingTriplet}
                              editDraft={isEditingTriplet ? tripletEditDraft?.targetEntity ?? null : null}
                              kindOptions={availableKindLabels}
                              onUpdateDraft={(field, value) =>
                                updateTripletEntityDraft(relationship.id, "targetEntity", field, value)
                              }
                              onUpdateAlias={(aliasIndex, value) =>
                                updateTripletEntityAlias(
                                  relationship.id,
                                  "targetEntity",
                                  aliasIndex,
                                  value,
                                )
                              }
                              onAddAlias={(value) =>
                                addTripletEntityAlias(relationship.id, "targetEntity", value)
                              }
                              onRemoveAlias={(aliasIndex) =>
                                removeTripletEntityAlias(
                                  relationship.id,
                                  "targetEntity",
                                  aliasIndex,
                                )
                              }
                            />
                          </div>

                          <div className="triplet-action-row">
                            <DecisionRow
                              compact
                              onDecision={(decision) =>
                                void recordDecision({
                                  itemType: "relationship",
                                  itemId: relationship.id,
                                  decision,
                                })
                              }
                            />

                            {isEditingTriplet ? (
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <MiniAction
                                  compact
                                  label={isSavingTriplet ? "Saving..." : "Save"}
                                  variant="primary"
                                  disabled={isSavingTriplet}
                                  onClick={() => void saveTripletEdit(relationship.id)}
                                />
                                <MiniAction
                                  compact
                                  label="Cancel"
                                  variant="neutral"
                                  disabled={isSavingTriplet}
                                  onClick={() => setTripletEditDraft(null)}
                                />
                              </div>
                            ) : (
                              <MiniAction
                                compact
                                label="Edit"
                                variant="link"
                                disabled={Boolean(savingTripletId)}
                                onClick={() => beginTripletEdit(relationship, sourceEntity, targetEntity)}
                              />
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <EmptyState text="No relationship triplets yet." />
                  )}
                </div>
              ) : (
                <EmptyState text="Select a session to inspect provisional graph artifacts." />
              )}
            </LaneSection>

            <LaneSection
              label="Supporting Review"
              title="Claims For Review"
              railColor="var(--route-yellow)"
            >
              {selectedSession?.claims.length ? (
                <div className="claims-review-list">
                  {selectedSession.claims.map((claim) => (
                    <article key={claim.id} className="claim-review-card">
                      <strong>{claim.text}</strong>
                      <StatusBar
                        status={claim.status}
                        detail={`confidence: ${claim.confidence}`}
                      />
                      <DecisionRow
                        onDecision={(decision) =>
                          void recordDecision({
                            itemType: "claim",
                            itemId: claim.id,
                            decision,
                          })
                        }
                      />
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState text="Structured claims extracted from the session will appear here." />
              )}
            </LaneSection>
          </div>
        </section>
      </section>
    </main>
  );
}

function LaneSection({
  label,
  title,
  railColor,
  children,
}: {
  label: string;
  title: string;
  railColor: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="lane-section"
      style={
        {
          "--lane-color": railColor,
        } as React.CSSProperties
      }
    >
      <div className="lane-section-header">
        <div className="lane-section-copy">
          <span className="lane-section-kicker">{label}</span>
          <h2 className="lane-section-title">{title}</h2>
        </div>
      </div>
      <div className="lane-section-body">{children}</div>
    </section>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="markdown-message">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>{text}</p>;
}

function DecisionRow({
  onDecision,
  compact = false,
}: {
  onDecision: (decision: "accepted" | "rejected" | "deferred") => void;
  compact?: boolean;
}) {
  return (
    <div className="decision-row">
      <MiniAction
        compact={compact}
        label="Accept"
        variant="accept"
        onClick={() => onDecision("accepted")}
      />
      <MiniAction
        compact={compact}
        label="Defer"
        variant="defer"
        onClick={() => onDecision("deferred")}
      />
      <MiniAction
        compact={compact}
        label="Reject"
        variant="reject"
        onClick={() => onDecision("rejected")}
      />
    </div>
  );
}

function MiniAction({
  label,
  variant,
  onClick,
  compact = false,
  disabled = false,
}: {
  label: string;
  variant: "accept" | "defer" | "reject" | "link" | "neutral" | "primary";
  onClick: () => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={`mini-action mini-action-${variant}${compact ? " mini-action-compact" : ""}`}
    >
      {label}
    </button>
  );
}

function StatusBar({
  status,
  detail,
}: {
  status: string;
  detail?: string;
}) {
  const statusClass =
    status === "accepted"
      ? "status-bar-accepted"
      : status === "rejected"
        ? "status-bar-rejected"
        : status === "deferred"
          ? "status-bar-deferred"
          : "status-bar-proposed";

  return (
    <div className={`status-bar ${statusClass}`}>
      <span aria-hidden className="status-bar-rail" />
      <span className="status-bar-label">{status}</span>
      {detail ? (
        <span className="status-bar-detail">{detail}</span>
      ) : null}
    </div>
  );
}

function TripletEntitySummary({
  displayName,
  kind,
  entity,
  danglingId,
  align,
  isEditing = false,
  editDraft = null,
  kindOptions,
  onUpdateDraft,
  onUpdateAlias,
  onAddAlias,
  onRemoveAlias,
}: {
  displayName: string;
  kind: string;
  entity: EntityCandidate | null;
  danglingId: string;
  align: "start" | "end";
  isEditing?: boolean;
  editDraft?: EntityEditDraft | null;
  kindOptions: string[];
  onUpdateDraft?: (field: "displayName" | "provisionalKind", value: string) => void;
  onUpdateAlias?: (aliasIndex: number, value: string) => void;
  onAddAlias?: (value: string) => void;
  onRemoveAlias?: (aliasIndex: number) => void;
}) {
  const kindListId = useId();
  const [nextAlias, setNextAlias] = useState("");

  function handleAddAlias() {
    if (!nextAlias.trim()) {
      return;
    }
    onAddAlias?.(nextAlias);
    setNextAlias("");
  }

  return (
    <div className={`triplet-entity-summary triplet-entity-summary-${align}`}>
      {isEditing && editDraft ? (
        <>
          <input
            value={editDraft.displayName}
            onChange={(event) => onUpdateDraft?.("displayName", event.target.value)}
            className="triplet-entity-name triplet-inline-input"
            aria-label={`${align === "start" ? "Subject" : "Object"} name`}
          />
          <input
            value={editDraft.provisionalKind}
            onChange={(event) => onUpdateDraft?.("provisionalKind", event.target.value)}
            className="triplet-entity-kind triplet-inline-input"
            list={kindListId}
            aria-label={`${align === "start" ? "Subject" : "Object"} kind`}
          />
          <datalist id={kindListId}>
            {kindOptions.map((kindOption) => (
              <option key={`${kindListId}-${kindOption}`} value={kindOption} />
            ))}
          </datalist>
          <div className="triplet-alias-editor">
            <p className="triplet-alias-label">Aliases</p>
            {editDraft.aliases.length ? (
              <div className="triplet-alias-list">
                {editDraft.aliases.map((alias, aliasIndex) => (
                  <div className="triplet-alias-row" key={`${align}-${aliasIndex}`}>
                    <input
                      value={alias}
                      onChange={(event) => onUpdateAlias?.(aliasIndex, event.target.value)}
                      className="triplet-inline-input triplet-alias-input"
                      aria-label={`${align === "start" ? "Subject" : "Object"} alias ${aliasIndex + 1}`}
                    />
                    <button
                      type="button"
                      className="triplet-alias-remove"
                      onClick={() => onRemoveAlias?.(aliasIndex)}
                      aria-label={`Remove alias ${aliasIndex + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="triplet-alias-empty">No aliases yet.</p>
            )}
            <div className="triplet-alias-add-row">
              <input
                value={nextAlias}
                onChange={(event) => setNextAlias(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddAlias();
                  }
                }}
                className="triplet-inline-input triplet-alias-input"
                placeholder="Add alias"
                aria-label={`${align === "start" ? "Subject" : "Object"} alias input`}
              />
              <button
                type="button"
                className="triplet-alias-add"
                onClick={handleAddAlias}
                disabled={!nextAlias.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className={entity ? "triplet-entity-name" : "triplet-entity-name triplet-entity-name-dangling"}>
            {displayName}
          </p>
          <p className="triplet-entity-kind">{kind}</p>
        </>
      )}
      {entity ? (
        <details className="entity-aliases triplet-entity-aliases">
          <summary>
            {entity.aliases.length} alias{entity.aliases.length === 1 ? "" : "es"}
          </summary>
          {entity.aliases.length ? (
            <ul>
              {entity.aliases.map((alias) => (
                <li key={alias}>{alias}</li>
              ))}
            </ul>
          ) : (
            <p>No aliases captured yet.</p>
          )}
        </details>
      ) : (
        <p className="triplet-dangling-note">dangling id: {danglingId}</p>
      )}
    </div>
  );
}
