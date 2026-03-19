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

  useEffect(() => {
    if (!latestAssistantMessageId || !latestAssistantMessageRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      latestAssistantMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [latestAssistantMessageId]);

  return (
    <main style={{ minHeight: "100vh", padding: "16px 20px 24px" }}>
      <section
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          display: "grid",
          gap: "16px",
        }}
      >
        <header
          style={{
            background: "var(--panel)",
            border: "2px solid var(--ink)",
            padding: "14px 16px",
            display: "grid",
            gap: "10px",
          }}
        >
          <div
            className="workspace-header-row"
            style={{
              display: "grid",
              gap: "12px",
              alignItems: "start",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "4px",
                alignContent: "start",
                maxWidth: "980px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--muted)",
                }}
              >
                A S13 Research, Design and Development Project.
              </span>
              <h1 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 40px)", lineHeight: 0.95 }}>
                GrooveGraph Research Workbench
              </h1>
            </div>
            <div
              className="workspace-header-controls"
              style={{
                display: "grid",
                gridTemplateColumns: "500px 375px",
                gap: "16px",
                alignItems: "start",
                justifyContent: "end",
                width: "100%",
                maxWidth: "100%",
              }}
            >
              <div
                style={{
                  border: "1px solid var(--border)",
                  background: "#ffffff",
                  padding: "10px",
                  display: "grid",
                  gap: "8px",
                  width: "500px",
                  height: "125px",
                }}
              >
                <label style={{ display: "grid", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      justifySelf: "end",
                      textAlign: "right",
                    }}
                  >
                    New Session
                  </span>
                  <input
                    value={seedQuery}
                    onChange={(event) => setSeedQuery(event.target.value)}
                    placeholder="Artist, URL, or question"
                    style={{
                      border: "1px solid var(--border)",
                      background: "#ffffff",
                      padding: "8px 10px",
                    }}
                  />
                </label>
                <button
                  onClick={() => void createSession()}
                  disabled={isBusy}
                  style={{
                    border: "1px solid var(--ink)",
                    background: "var(--route-blue)",
                    color: "#ffffff",
                    padding: "8px 12px",
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                >
                  {isBusy ? "Working..." : "Create Session"}
                </button>
              </div>

              <div
                style={{
                  border: "1px solid var(--border)",
                  background: "#ffffff",
                  padding: "10px",
                  display: "grid",
                  gap: "8px",
                  width: "375px",
                  height: "125px",
                  overflow: "auto",
                }}
              >
                <strong
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    textAlign: "right",
                  }}
                >
                  Past Sessions
                </strong>
                <div style={{ display: "grid", gap: "6px", maxHeight: "146px", overflow: "auto", paddingRight: "2px" }}>
                  {sessions.length === 0 ? (
                    <EmptyState text="No sessions yet." />
                  ) : (
                    sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        style={{
                          textAlign: "left",
                          display: "grid",
                          gap: "3px",
                          padding: "8px",
                          border:
                            selectedSessionId === session.id
                              ? "2px solid var(--ink)"
                              : "1px solid var(--border)",
                          background:
                            selectedSessionId === session.id
                              ? "rgba(27,103,201,0.08)"
                              : "#ffffff",
                        }}
                      >
                        <strong style={{ fontSize: "13px" }}>{session.title}</strong>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {formatTimestamp(session.updatedAt)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div
              style={{
                border: "1px solid rgba(215, 51, 47, 0.4)",
                background: "rgba(215, 51, 47, 0.08)",
                color: "var(--route-red)",
                padding: "10px 12px",
              }}
            >
              {error}
            </div>
          ) : null}
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
          <div style={{ display: "grid", gap: "16px" }}>
            <Panel title="Chat" accent="var(--route-blue)">
              {selectedSession ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                      maxHeight: "42vh",
                      overflow: "auto",
                      paddingRight: "6px",
                    }}
                  >
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
                          style={{
                            border: "1px solid var(--border)",
                            background:
                              entry.role === "assistant"
                                ? "#ffffff"
                                : "rgba(27,103,201,0.06)",
                            padding: "12px 14px",
                            display: "grid",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "12px",
                            }}
                          >
                            <strong style={{ textTransform: "capitalize" }}>
                              {entry.role}
                            </strong>
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                              {formatTimestamp(entry.createdAt)}
                            </span>
                          </div>
                          <MarkdownMessage content={entry.content} />
                        </article>
                      ))
                    )}
                  </div>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Ask a discovery question, refine the investigation, or request more evidence."
                      rows={3}
                      style={{
                        border: "1px solid var(--border)",
                        background: "#ffffff",
                        padding: "10px 12px",
                        resize: "vertical",
                      }}
                    />
                    <button
                      onClick={() => void sendTurn()}
                      disabled={isBusy}
                      style={{
                        border: "1px solid var(--ink)",
                        background: "var(--ink)",
                        color: "#ffffff",
                        padding: "10px 14px",
                        fontWeight: 700,
                      }}
                    >
                      {isBusy ? "Running Research..." : "Send Turn"}
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState text="Select or create a session to begin chatting." />
              )}
            </Panel>

            <Panel title="Session Notes" accent="var(--route-green)">
              {selectedSession?.notes.length ? (
                <ul style={{ margin: 0, paddingLeft: "18px", display: "grid", gap: "8px" }}>
                  {selectedSession.notes.map((note, index) => (
                    <li key={`${note}-${index}`}>{note}</li>
                  ))}
                </ul>
              ) : (
                <EmptyState text="Notes recorded by the model will appear here." />
              )}
            </Panel>

            <details
              style={{
                border: "2px solid var(--ink)",
                background: "var(--panel)",
              }}
            >
              <summary
                style={{
                  padding: "12px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "13px",
                  borderBottom: "1px solid var(--border)",
                  background: "#ffffff",
                }}
              >
                Sources
              </summary>
              <div style={{ padding: "14px" }}>
                {selectedSession?.sources.length ? (
                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                      maxHeight: "58vh",
                      overflow: "auto",
                      paddingRight: "6px",
                    }}
                  >
                    {selectedSession.sources.map((source) => (
                      <article
                        key={source.id}
                        style={{
                          border: "1px solid var(--border)",
                          background: "#ffffff",
                          padding: "12px",
                        }}
                      >
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontWeight: 700, textDecoration: "none" }}
                        >
                          {source.title}
                        </a>
                        <p
                          style={{
                            margin: "8px 0 0",
                            fontSize: "12px",
                            color: "var(--muted)",
                            wordBreak: "break-word",
                          }}
                        >
                          {source.url}
                        </p>
                        {source.citationText ? (
                          <p style={{ margin: "8px 0 0", fontSize: "13px", lineHeight: 1.5 }}>
                            {source.citationText}
                          </p>
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

          {!isNarrowWorkspaceLayout ? (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize workspace columns"
              tabIndex={-1}
              className={`workspace-splitter${isMainGridResizing ? " workspace-splitter-active" : ""}`}
              onPointerDown={beginMainGridResize}
            >
              <span className="workspace-splitter-grip" aria-hidden />
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "16px" }}>
            <Panel title="Graph Candidates" accent="var(--route-orange)">
              {selectedSession ? (
                <div style={{ display: "grid", gap: "14px" }}>
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
                          style={{
                            border: "1px solid var(--border)",
                            background: "#ffffff",
                            padding: "12px",
                            display: "grid",
                            gap: "10px",
                          }}
                        >
                          <div className="triplet-card-header">
                            <StatusBar
                              status={relationship.status}
                            />
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
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
                                  accent="var(--route-green)"
                                  disabled={isSavingTriplet}
                                  onClick={() => void saveTripletEdit(relationship.id)}
                                />
                                <MiniAction
                                  compact
                                  label="Cancel"
                                  accent="var(--muted)"
                                  disabled={isSavingTriplet}
                                  onClick={() => setTripletEditDraft(null)}
                                />
                              </div>
                            ) : (
                              <MiniAction
                                compact
                                label="Edit"
                                accent="var(--route-blue)"
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
            </Panel>

            <Panel title="Claims" accent="var(--route-green)">
              {selectedSession?.claims.length ? (
                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                    maxHeight: "44vh",
                    overflow: "auto",
                    paddingRight: "6px",
                  }}
                >
                  {selectedSession.claims.map((claim) => (
                    <article
                      key={claim.id}
                      style={{
                        border: "1px solid var(--border)",
                        background: "#ffffff",
                        padding: "12px",
                        display: "grid",
                        gap: "10px",
                      }}
                    >
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
            </Panel>
          </div>
        </section>

      </section>
    </main>
  );
}

function Panel({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        minHeight: "120px",
        border: "2px solid var(--ink)",
        background: "var(--panel)",
        display: "grid",
        gridTemplateRows: "auto 1fr",
      }}
    >
      <div
        style={{
          borderBottom: "2px solid var(--ink)",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "#ffffff",
        }}
      >
        <span
          aria-hidden
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "999px",
            background: accent,
            display: "inline-block",
          }}
        />
        <strong style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</strong>
      </div>
      <div style={{ padding: "14px" }}>{children}</div>
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
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <MiniAction
        compact={compact}
        label="Accept"
        accent="var(--route-green)"
        onClick={() => onDecision("accepted")}
      />
      <MiniAction
        compact={compact}
        label="Defer"
        accent="var(--route-orange)"
        onClick={() => onDecision("deferred")}
      />
      <MiniAction
        compact={compact}
        label="Reject"
        accent="var(--route-red)"
        onClick={() => onDecision("rejected")}
      />
    </div>
  );
}

function MiniAction({
  label,
  accent,
  onClick,
  compact = false,
  disabled = false,
}: {
  label: string;
  accent: string;
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
      style={{
        border: "1px solid var(--border)",
        background: "#ffffff",
        color: accent,
        padding: compact ? "4px 8px" : "6px 10px",
        fontSize: compact ? "11px" : "12px",
        fontWeight: 700,
      }}
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
  const color =
    status === "accepted"
      ? "var(--route-green)"
      : status === "rejected"
        ? "var(--route-red)"
        : status === "deferred"
          ? "var(--route-orange)"
          : "var(--route-blue)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color }}>
      <span
        aria-hidden
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "999px",
          display: "inline-block",
          background: color,
        }}
      />
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {status}
      </span>
      {detail ? (
        <span style={{ fontSize: "12px", color: "var(--muted)" }}>{detail}</span>
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
