"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ResearchSession,
  ReviewDecisionRequest,
} from "@/src/types/research-session";

type WorkspaceResponse = {
  session: ResearchSession;
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

export default function HomePage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [seedQuery, setSeedQuery] = useState("Prince");
  const [message, setMessage] = useState("Gather high-confidence evidence about Prince's collaborators, labels, and major releases.");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

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

  return (
    <main style={{ minHeight: "100vh", padding: "24px" }}>
      <section
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          display: "grid",
          gap: "20px",
        }}
      >
        <header
          style={{
            background: "var(--panel)",
            border: "2px solid var(--ink)",
            padding: "24px 28px",
            display: "grid",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: "6px" }}>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                GrooveGraph Research Tool
              </span>
              <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 52px)", lineHeight: 0.95 }}>
                OpenAI Research Workspace
              </h1>
            </div>
            <div
              style={{
                minWidth: "320px",
                display: "grid",
                gap: "10px",
                alignContent: "start",
              }}
            >
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>New artist seed</span>
                <input
                  value={seedQuery}
                  onChange={(event) => setSeedQuery(event.target.value)}
                  placeholder="Artist, URL, or question"
                  style={{
                    border: "1px solid var(--border)",
                    background: "#ffffff",
                    padding: "10px 12px",
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
                  padding: "10px 14px",
                  fontWeight: 700,
                }}
              >
                {isBusy ? "Working..." : "Create Session"}
              </button>
            </div>
          </div>
          <p style={{ margin: 0, maxWidth: "980px", color: "var(--muted)" }}>
            This workspace uses the OpenAI Responses and Conversations APIs to run a discovery-first investigation loop:
            search, collect, persist, revisit, and only later normalize.
          </p>
          {error ? (
            <div
              style={{
                border: "1px solid rgba(215, 51, 47, 0.4)",
                background: "rgba(215, 51, 47, 0.08)",
                color: "var(--route-red)",
                padding: "12px 14px",
              }}
            >
              {error}
            </div>
          ) : null}
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "280px minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr)",
            gap: "16px",
            alignItems: "start",
          }}
        >
          <aside
            style={{
              display: "grid",
              gap: "12px",
              position: "sticky",
              top: "20px",
            }}
          >
            <Panel title="Sessions" accent="var(--route-orange)">
              <div style={{ display: "grid", gap: "8px" }}>
                {sessions.length === 0 ? (
                  <EmptyState text="No sessions yet. Create one with an artist or question." />
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      style={{
                        textAlign: "left",
                        display: "grid",
                        gap: "6px",
                        padding: "12px",
                        border: selectedSessionId === session.id ? "2px solid var(--ink)" : "1px solid var(--border)",
                        background: selectedSessionId === session.id ? "rgba(27,103,201,0.08)" : "#ffffff",
                      }}
                    >
                      <strong>{session.title}</strong>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>{session.status}</span>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>{formatTimestamp(session.updatedAt)}</span>
                    </button>
                  ))
                )}
              </div>
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
          </aside>

          <Panel title="Chat" accent="var(--route-blue)">
            {selectedSession ? (
              <div style={{ display: "grid", gap: "14px" }}>
                <div style={{ display: "grid", gap: "10px", maxHeight: "68vh", overflow: "auto", paddingRight: "6px" }}>
                  {selectedSession.messages.length === 0 ? (
                    <EmptyState text="Send a message to start the artist-seed investigation." />
                  ) : (
                    selectedSession.messages.map((entry) => (
                      <article
                        key={entry.id}
                        style={{
                          border: "1px solid var(--border)",
                          background: entry.role === "assistant" ? "#ffffff" : "rgba(27,103,201,0.06)",
                          padding: "12px 14px",
                          display: "grid",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                          <strong style={{ textTransform: "capitalize" }}>{entry.role}</strong>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>{formatTimestamp(entry.createdAt)}</span>
                        </div>
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{entry.content}</div>
                      </article>
                    ))
                  )}
                </div>
                <div style={{ display: "grid", gap: "10px" }}>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Ask a discovery question, refine the investigation, or request more evidence."
                    rows={5}
                    style={{
                      border: "1px solid var(--border)",
                      background: "#ffffff",
                      padding: "12px",
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
                      padding: "12px 14px",
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

          <div style={{ display: "grid", gap: "16px" }}>
            <Panel title="Sources" accent="var(--route-red)">
              {selectedSession?.sources.length ? (
                <div style={{ display: "grid", gap: "10px", maxHeight: "68vh", overflow: "auto", paddingRight: "6px" }}>
                  {selectedSession.sources.map((source) => (
                    <article key={source.id} style={{ border: "1px solid var(--border)", background: "#ffffff", padding: "12px" }}>
                      <a href={source.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, textDecoration: "none" }}>
                        {source.title}
                      </a>
                      <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--muted)", wordBreak: "break-word" }}>
                        {source.url}
                      </p>
                      {source.citationText ? (
                        <p style={{ margin: "8px 0 0", fontSize: "13px", lineHeight: 1.5 }}>{source.citationText}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState text="Cited sources will appear here once the model searches the web." />
              )}
            </Panel>

            <Panel title="Claims" accent="var(--route-green)">
              {selectedSession?.claims.length ? (
                <div style={{ display: "grid", gap: "10px", maxHeight: "50vh", overflow: "auto", paddingRight: "6px" }}>
                  {selectedSession.claims.map((claim) => (
                    <article key={claim.id} style={{ border: "1px solid var(--border)", background: "#ffffff", padding: "12px", display: "grid", gap: "10px" }}>
                      <strong>{claim.text}</strong>
                      <StatusBar status={claim.status} detail={`confidence: ${claim.confidence}`} />
                      <DecisionRow
                        onDecision={(decision) =>
                          void recordDecision({ itemType: "claim", itemId: claim.id, decision })
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

          <Panel title="Graph Candidates" accent="var(--route-orange)">
            {selectedSession ? (
              <div style={{ display: "grid", gap: "14px" }}>
                <div style={{ display: "grid", gap: "8px" }}>
                  <h2 style={{ margin: 0, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Entities
                  </h2>
                  {selectedSession.entityCandidates.length ? (
                    selectedSession.entityCandidates.map((entity) => (
                      <article key={entity.id} style={{ border: "1px solid var(--border)", background: "#ffffff", padding: "12px", display: "grid", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                          <strong>{entity.displayName}</strong>
                          <span style={{ color: "var(--muted)", fontSize: "12px" }}>{entity.provisionalKind}</span>
                        </div>
                        <StatusBar status={entity.status} detail={`${entity.aliases.length} aliases`} />
                        <DecisionRow
                          onDecision={(decision) =>
                            void recordDecision({ itemType: "entity", itemId: entity.id, decision })
                          }
                        />
                      </article>
                    ))
                  ) : (
                    <EmptyState text="No entity candidates yet." />
                  )}
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  <h2 style={{ margin: 0, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Relationships
                  </h2>
                  {selectedSession.relationshipCandidates.length ? (
                    selectedSession.relationshipCandidates.map((relationship) => (
                      <article key={relationship.id} style={{ border: "1px solid var(--border)", background: "#ffffff", padding: "12px", display: "grid", gap: "8px" }}>
                        <strong>{relationship.verb}</strong>
                        <StatusBar status={relationship.status} detail={`confidence: ${relationship.confidence}`} />
                        <DecisionRow
                          onDecision={(decision) =>
                            void recordDecision({ itemType: "relationship", itemId: relationship.id, decision })
                          }
                        />
                      </article>
                    ))
                  ) : (
                    <EmptyState text="No relationship candidates yet." />
                  )}
                </div>
              </div>
            ) : (
              <EmptyState text="Select a session to inspect provisional graph artifacts." />
            )}
          </Panel>
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

function EmptyState({ text }: { text: string }) {
  return <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>{text}</p>;
}

function DecisionRow({
  onDecision,
}: {
  onDecision: (decision: "accepted" | "rejected" | "deferred") => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <MiniAction label="Accept" accent="var(--route-green)" onClick={() => onDecision("accepted")} />
      <MiniAction label="Defer" accent="var(--route-orange)" onClick={() => onDecision("deferred")} />
      <MiniAction label="Reject" accent="var(--route-red)" onClick={() => onDecision("rejected")} />
    </div>
  );
}

function MiniAction({
  label,
  accent,
  onClick,
}: {
  label: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "1px solid var(--border)",
        background: "#ffffff",
        color: accent,
        padding: "6px 10px",
        fontSize: "12px",
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
  detail: string;
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
      <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {status}
      </span>
      <span style={{ fontSize: "12px", color: "var(--muted)" }}>{detail}</span>
    </div>
  );
}
