"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkspaceResponse } from "@/src/components/research-workbench-model";
import { fetchJson } from "@/src/components/research-workbench-utils";
import {
  mergeAtlasLineageWithProposals,
  sessionHasProposedGraphCandidates,
} from "@/src/lib/workbench-viz/atlas-lineage-proposal-graph";
import { provisionalKindToFamily, type KindFamily } from "@/src/lib/workbench-viz/graph-viz-styles";
import { graphVizLoadProgressForElapsed } from "@/src/lib/research-turn-progress-ui";
import { workbenchVizToAtlasLineageGraph } from "@/src/lib/workbench-viz/workbench-viz-to-atlas-lineage";
import type { ResearchSession } from "@/src/types/research-session";
import type { AtlasDemoNode, AtlasSchemaKind } from "@/src/types/atlas-lineage";
import type { WorkbenchVizApiResponse } from "@/src/types/workbench-viz-graph";
import { applyAtlasFilters, type AtlasViewMode } from "./atlas-lineage-demo-data";
import { AtlasKindMultiselect } from "./AtlasKindMultiselect";
import { AtlasLineageChatRail } from "./AtlasLineageChatRail";
import {
  AtlasLineageGraph,
  type AtlasLineageGraphHandle,
} from "./AtlasLineageGraph";
import { AtlasLineageProposalReview } from "./AtlasLineageProposalReview";
import { SessionCreateNameDialog } from "@/src/components/SessionCreateNameDialog";

/** `select` value that triggers `POST /api/sessions` instead of selecting an id. */
const NEW_SESSION_SELECT_VALUE = "__gg_atlas_new_session__";

function IconZoomIn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

function IconZoomOut() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35M8 11h6" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function AtlasLineagePage() {
  const graphRef = useRef<AtlasLineageGraphHandle>(null);

  const [viewMode, setViewMode] = useState<AtlasViewMode>("full");
  const [kinds, setKinds] = useState<AtlasSchemaKind[]>([]);
  const [lightTheme, setLightTheme] = useState(false);

  /** Graph canvas always loads TypeDB global workbench entities; session is for chat / proposals only. */
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [vizLoading, setVizLoading] = useState(false);
  const [vizError, setVizError] = useState<string | null>(null);
  const [vizRaw, setVizRaw] = useState<WorkbenchVizApiResponse["graph"] | null>(null);
  const [newSessionBusy, setNewSessionBusy] = useState(false);
  const [newSessionSuggestBusy, setNewSessionSuggestBusy] = useState(false);
  const [newSessionError, setNewSessionError] = useState<string | null>(null);
  const [newSessionDialog, setNewSessionDialog] = useState<{
    seedDraft: string;
    titleDraft: string;
    titleTouched: boolean;
  } | null>(null);
  const sessionBeforeNewRef = useRef<string | null>(null);
  const [sessionTitleDraft, setSessionTitleDraft] = useState("");
  const [sessionTitleBusy, setSessionTitleBusy] = useState(false);
  const [sessionTitleError, setSessionTitleError] = useState<string | null>(null);
  /** True after the user edits the session name field; cleared on session switch / successful save. */
  const sessionTitleDirtyRef = useRef(false);
  /** One-hop neighborhood focus (server-side for session/TypeDB, client-side for demo). */
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [detailSession, setDetailSession] = useState<ResearchSession | null>(null);
  const [vizReloadToken, setVizReloadToken] = useState(0);
  /** Drives elapsed-time labels while `/api/graph/viz` is in flight. */
  const [vizProgressTick, setVizProgressTick] = useState(0);
  const vizLoadStartedAtRef = useRef(0);
  /** Visual-only focus for proposal overlay nodes (`cand:*`); never sent to viz API. */
  const [graphHighlightId, setGraphHighlightId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) {
        setSessions([]);
        return;
      }
      const body = (await res.json()) as { sessions: ResearchSession[] };
      setSessions(body.sessions ?? []);
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const bumpViz = useCallback(() => {
    setVizReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!sessionId || !detailSession || detailSession.id !== sessionId) {
      return;
    }
    if (!sessionTitleDirtyRef.current) {
      setSessionTitleDraft(detailSession.title);
    }
  }, [sessionId, detailSession]);

  useEffect(() => {
    if (!sessionId) {
      setDetailSession(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchJson<{ session: ResearchSession }>(
          `/api/sessions/${encodeURIComponent(sessionId)}`,
        );
        if (!cancelled) {
          setDetailSession(data.session);
        }
      } catch {
        if (!cancelled) {
          setDetailSession(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleSessionUpdated = useCallback(
    (s: ResearchSession) => {
      setDetailSession(s);
      setSessions((prev) => prev.map((x) => (x.id === s.id ? s : x)));
      bumpViz();
    },
    [bumpViz],
  );

  useEffect(() => {
    if (!newSessionDialog || newSessionDialog.titleTouched) {
      return;
    }
    const seed = newSessionDialog.seedDraft.trim();
    if (seed.length < 2) {
      return;
    }
    let cancelled = false;
    const tid = window.setTimeout(() => {
      void (async () => {
        setNewSessionSuggestBusy(true);
        try {
          const res = await fetch("/api/sessions/suggest-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seedQuery: seed }),
          });
          if (cancelled || !res.ok) {
            return;
          }
          const body = (await res.json()) as { suggestedTitle?: string };
          if (cancelled) {
            return;
          }
          const suggested = typeof body.suggestedTitle === "string" ? body.suggestedTitle.trim() : "";
          if (!suggested) {
            return;
          }
          setNewSessionDialog((d) => (d && !d.titleTouched ? { ...d, titleDraft: suggested } : d));
        } catch {
          /* network */
        } finally {
          if (!cancelled) {
            setNewSessionSuggestBusy(false);
          }
        }
      })();
    }, 480);
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
    };
  }, [newSessionDialog?.seedDraft, newSessionDialog?.titleTouched]);

  const confirmNewSessionDialog = useCallback(async () => {
    if (!newSessionDialog) {
      return;
    }
    const seedQuery = newSessionDialog.seedDraft.trim();
    const title = newSessionDialog.titleDraft.trim();
    if (!seedQuery || !title) {
      return;
    }
    setNewSessionError(null);
    setNewSessionBusy(true);
    try {
      const data = await fetchJson<WorkspaceResponse>("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedQuery, title }),
      });
      const created = data.session;
      setNewSessionDialog(null);
      setSessions((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      setDetailSession(created);
      sessionTitleDirtyRef.current = false;
      setSessionTitleDraft(created.title);
      setSessionTitleError(null);
      setSessionId(created.id);
      setKinds([]);
      setFocusNodeId(null);
      void loadSessions();
    } catch (err: unknown) {
      setNewSessionError(err instanceof Error ? err.message : "Could not create session.");
    } finally {
      setNewSessionBusy(false);
    }
  }, [loadSessions, newSessionDialog]);

  const cancelNewSessionDialog = useCallback(() => {
    setNewSessionDialog(null);
    setNewSessionError(null);
  }, []);

  const onSessionSelectChange = useCallback(
    (value: string) => {
      setNewSessionError(null);
      if (value === NEW_SESSION_SELECT_VALUE) {
        sessionBeforeNewRef.current = sessionId;
        setNewSessionDialog({ seedDraft: "", titleDraft: "", titleTouched: false });
        return;
      }
      sessionTitleDirtyRef.current = false;
      setSessionTitleError(null);
      if (!value) {
        setSessionTitleDraft("");
        setSessionId(null);
        return;
      }
      setSessionId(value);
      const picked = sessions.find((s) => s.id === value);
      setSessionTitleDraft(picked?.title ?? "");
    },
    [sessions, sessionId],
  );

  const saveSessionTitle = useCallback(async () => {
    if (!sessionId || !detailSession || detailSession.id !== sessionId) {
      return;
    }
    const next = sessionTitleDraft.trim();
    if (!next || next === detailSession.title.trim()) {
      return;
    }
    setSessionTitleError(null);
    setSessionTitleBusy(true);
    try {
      const data = await fetchJson<WorkspaceResponse>(
        `/api/sessions/${encodeURIComponent(sessionId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: next }),
        },
      );
      sessionTitleDirtyRef.current = false;
      handleSessionUpdated(data.session);
    } catch (err: unknown) {
      setSessionTitleError(err instanceof Error ? err.message : "Could not save session name.");
    } finally {
      setSessionTitleBusy(false);
    }
  }, [sessionId, detailSession, sessionTitleDraft, handleSessionUpdated]);

  const sessionTitleDirty =
    sessionId !== null &&
    detailSession !== null &&
    detailSession.id === sessionId &&
    sessionTitleDraft.trim() !== detailSession.title.trim();

  useEffect(() => {
    setFocusNodeId(null);
    setGraphHighlightId(null);
  }, [sessionId]);

  useEffect(() => {
    setGraphHighlightId(null);
  }, [focusNodeId]);

  useEffect(() => {
    let cancelled = false;
    vizLoadStartedAtRef.current = Date.now();
    setVizProgressTick(0);
    const progressInterval = window.setInterval(() => {
      setVizProgressTick((n) => n + 1);
    }, 450);
    setVizLoading(true);
    setVizError(null);

    const focusQs = focusNodeId ? `?focusNodeId=${encodeURIComponent(focusNodeId)}` : "";
    const vizUrl = `/api/graph/viz${focusQs}`;

    async function parseVizError(res: Response): Promise<string> {
      const text = await res.text();
      if (!text) return res.statusText;
      try {
        const j = JSON.parse(text) as { error?: string };
        if (typeof j?.error === "string" && j.error) return j.error;
      } catch {
        /* plain text body */
      }
      return text;
    }

    void fetch(vizUrl)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await parseVizError(res));
        }
        return res.json() as Promise<WorkbenchVizApiResponse>;
      })
      .then((body) => {
        if (cancelled) return;
        setVizRaw(body.graph);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVizRaw(null);
        setVizError(err instanceof Error ? err.message : "Failed to load graph");
      })
      .finally(() => {
        if (!cancelled) {
          setVizLoading(false);
        }
      });
    return () => {
      cancelled = true;
      window.clearInterval(progressInterval);
    };
  }, [focusNodeId, vizReloadToken]);

  /** `null` until first viz payload; then distinct kind families from graph (or empty if no nodes). */
  const kindFamiliesFromGraph = useMemo((): KindFamily[] | null => {
    if (vizRaw === null) {
      return null;
    }
    if (!vizRaw.nodes?.length) {
      return [];
    }
    const set = new Set<KindFamily>();
    for (const n of vizRaw.nodes) {
      set.add(provisionalKindToFamily(n.subtitle));
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [vizRaw]);

  useEffect(() => {
    if (kindFamiliesFromGraph === null) {
      return;
    }
    setKinds((prev) =>
      prev.filter((k) => kindFamiliesFromGraph.length === 0 || kindFamiliesFromGraph.includes(k as KindFamily)),
    );
  }, [kindFamiliesFromGraph]);

  const vizAtlasGraph = useMemo(() => {
    if (!vizRaw) {
      return workbenchVizToAtlasLineageGraph({ nodes: [], edges: [] });
    }
    return workbenchVizToAtlasLineageGraph(vizRaw);
  }, [vizRaw]);

  const baseGraph = useMemo(() => {
    if (!detailSession || !sessionHasProposedGraphCandidates(detailSession)) {
      return vizAtlasGraph;
    }
    return mergeAtlasLineageWithProposals(vizAtlasGraph, detailSession);
  }, [detailSession, vizAtlasGraph]);

  const resolvedSession =
    detailSession ??
    (sessionId ? (sessions.find((s) => s.id === sessionId) ?? null) : null);

  const handleNodeClick = useCallback((node: AtlasDemoNode) => {
    if (node.id.startsWith("cand:")) {
      setGraphHighlightId(node.id);
      return;
    }
    setGraphHighlightId(null);
    setFocusNodeId(node.id);
  }, []);

  const filtered = useMemo(
    () =>
      applyAtlasFilters(baseGraph, {
        viewMode,
        kinds,
        search: "",
        showOrganizations: true,
        showSources: true,
        dataMode: "typedb_global",
      }),
    [baseGraph, viewMode, kinds],
  );

  const graphStageLoading = vizLoading && !vizRaw;
  const graphStageError = !vizRaw && Boolean(vizError);

  const vizLoadProgressUi = useMemo(() => {
    if (!vizLoading) {
      return null;
    }
    void vizProgressTick;
    const elapsedMs = Date.now() - vizLoadStartedAtRef.current;
    return graphVizLoadProgressForElapsed(elapsedMs, focusNodeId !== null);
  }, [vizLoading, vizProgressTick, focusNodeId]);

  const emptyLiveGraphMessage =
    vizRaw &&
    baseGraph.nodes.length === 0 &&
    filtered.nodes.length === 0
      ? "No graph entities in this scope. Add entities in the workbench from TypeDB."
      : undefined;

  const rootClass = lightTheme ? "gg-atlas-lineage gg-atlas-lineage--light" : "gg-atlas-lineage";

  return (
    <div className={rootClass}>
      <header className="gg-atlas-lineage__header">
        <Link href="/main" className="gg-atlas-lineage__brand">
          <p className="gg-atlas-lineage__kicker">GrooveGraph</p>
          <p className="gg-atlas-lineage__title">Lineage explorer</p>
        </Link>
      </header>

      <div className="gg-atlas-lineage__data-strip" role="region" aria-label="Session and graph filters">
        <div className="gg-atlas-lineage__data-strip-primary">
          <label htmlFor="atlas-session" className="sr-only">
            Research session (chat and proposals)
          </label>
          <select
            id="atlas-session"
            className="gg-atlas-lineage__select gg-atlas-lineage__select--session"
            value={newSessionDialog ? (sessionBeforeNewRef.current ?? "") : (sessionId ?? "")}
            disabled={newSessionBusy || newSessionDialog !== null}
            onChange={(e) => onSessionSelectChange(e.target.value)}
          >
            <option value="">Select session…</option>
            <option value={NEW_SESSION_SELECT_VALUE}>
              {newSessionBusy ? "Creating session…" : "+ New session…"}
            </option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {(s.title || s.seedQuery || s.id).slice(0, 72)}
              </option>
            ))}
          </select>
          <div className="gg-atlas-lineage__data-strip-kind" role="toolbar" aria-label="Graph type filters">
            <span className="sr-only" id="atlas-kind-label">
              Filter by entity type (multi-select)
            </span>
            <AtlasKindMultiselect
              aria-labelledby="atlas-kind-label"
              variant="live"
              value={kinds}
              onChange={setKinds}
              kindFamiliesFromGraph={kindFamiliesFromGraph}
            />
          </div>
        </div>
        {sessionId && detailSession && detailSession.id === sessionId ? (
          <div className="gg-atlas-lineage__session-title-group">
            <label htmlFor="atlas-session-name" className="sr-only">
              Session display name
            </label>
            <input
              id="atlas-session-name"
              type="text"
              className="gg-atlas-lineage__session-title-input"
              value={sessionTitleDraft}
              onChange={(e) => {
                sessionTitleDirtyRef.current = true;
                setSessionTitleDraft(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void saveSessionTitle();
                }
              }}
              disabled={sessionTitleBusy || newSessionBusy || newSessionDialog !== null}
              placeholder="Session name"
              autoComplete="off"
              maxLength={220}
              aria-invalid={Boolean(sessionTitleError)}
            />
            <button
              type="button"
              className="gg-atlas-lineage__btn-secondary gg-atlas-lineage__session-title-save"
              disabled={
                sessionTitleBusy ||
                newSessionBusy ||
                !sessionTitleDraft.trim() ||
                !sessionTitleDirty
              }
              onClick={() => void saveSessionTitle()}
            >
              {sessionTitleBusy ? "Saving…" : "Save name"}
            </button>
          </div>
        ) : null}
        {sessionTitleError ? (
          <span className="gg-atlas-lineage__status gg-atlas-lineage__status--error" role="alert">
            {sessionTitleError}
          </span>
        ) : null}
        {newSessionError ? (
          <span className="gg-atlas-lineage__status gg-atlas-lineage__status--error" role="alert">
            {newSessionError}
          </span>
        ) : null}
        {vizLoadProgressUi ? (
          <div
            className="gg-atlas-lineage__viz-strip-progress"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="gg-atlas-lineage__viz-strip-phase">{vizLoadProgressUi.phaseLabel}</span>
            <span className="gg-atlas-lineage__viz-strip-detail">{vizLoadProgressUi.detailLine}</span>
            <span className="gg-atlas-lineage__viz-strip-eta">{vizLoadProgressUi.etaLine}</span>
          </div>
        ) : null}
        {vizError ? (
          <span className="gg-atlas-lineage__status gg-atlas-lineage__status--error" role="alert">
            {vizError}
          </span>
        ) : null}
        {focusNodeId ? (
          <button type="button" className="gg-atlas-lineage__focus-clear" onClick={() => setFocusNodeId(null)}>
            Clear focus (full graph)
          </button>
        ) : null}
      </div>

      <main className="gg-atlas-lineage__main">
        <div className="gg-atlas-lineage__work-area">
          <AtlasLineageChatRail
            sessionId={sessionId}
            session={resolvedSession}
            onSessionUpdated={handleSessionUpdated}
          />
          <div className="gg-atlas-lineage__work-column">
            {sessionId ? (
              <AtlasLineageProposalReview
                session={detailSession}
                sessionId={sessionId}
                onSessionUpdated={handleSessionUpdated}
                onHighlightCandidate={(id) => setGraphHighlightId(`cand:${id}`)}
              />
            ) : null}
            <div className="gg-atlas-lineage__stage-wrap">
              {graphStageLoading && vizLoadProgressUi ? (
                <div className="gg-atlas-lineage__empty gg-atlas-lineage__graph-load-progress" role="status">
                  <p className="gg-atlas-lineage__graph-load-progress-title">{vizLoadProgressUi.phaseLabel}</p>
                  <p className="gg-atlas-lineage__graph-load-progress-detail">{vizLoadProgressUi.detailLine}</p>
                  <p className="gg-atlas-lineage__graph-load-progress-eta">{vizLoadProgressUi.etaLine}</p>
                </div>
              ) : graphStageLoading ? (
                <div className="gg-atlas-lineage__empty" role="status">
                  Loading graph…
                </div>
              ) : graphStageError ? (
                <div
                  className="gg-atlas-lineage__empty gg-atlas-lineage__status--error"
                  role="alert"
                >
                  {vizError}
                </div>
              ) : (
                <AtlasLineageGraph
                  ref={graphRef}
                  graph={filtered}
                  onNodeClick={handleNodeClick}
                  emptyGraphMessage={emptyLiveGraphMessage}
                  highlightNodeId={graphHighlightId}
                />
              )}
              <div className="gg-atlas-lineage__toolbar" role="toolbar" aria-label="Graph view">
                <button
                  type="button"
                  className="gg-atlas-lineage__tool-btn"
                  title="Zoom in"
                  aria-label="Zoom in"
                  onClick={() => graphRef.current?.zoomIn()}
                >
                  <IconZoomIn />
                </button>
                <button
                  type="button"
                  className="gg-atlas-lineage__tool-btn"
                  title="Zoom out"
                  aria-label="Zoom out"
                  onClick={() => graphRef.current?.zoomOut()}
                >
                  <IconZoomOut />
                </button>
                <button
                  type="button"
                  className="gg-atlas-lineage__tool-btn"
                  title="Reset pan and zoom"
                  aria-label="Reset pan and zoom"
                  onClick={() => graphRef.current?.resetView()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="gg-atlas-lineage__tool-btn"
                  title={lightTheme ? "Switch to dark" : "Switch to light"}
                  aria-label={lightTheme ? "Switch to dark theme" : "Switch to light theme"}
                  onClick={() => setLightTheme((v) => !v)}
                >
                  {lightTheme ? <IconMoon /> : <IconSun />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SessionCreateNameDialog
        open={newSessionDialog !== null}
        mode="prompt-and-name"
        promptValue={newSessionDialog?.seedDraft ?? ""}
        onPromptChange={(value) => setNewSessionDialog((d) => (d ? { ...d, seedDraft: value } : d))}
        nameValue={newSessionDialog?.titleDraft ?? ""}
        onNameChange={(value) =>
          setNewSessionDialog((d) => (d ? { ...d, titleDraft: value, titleTouched: true } : d))
        }
        suggestBusy={newSessionSuggestBusy}
        confirmBusy={newSessionBusy}
        error={newSessionError}
        onCancel={cancelNewSessionDialog}
        onConfirm={() => void confirmNewSessionDialog()}
        variant="light"
      />
    </div>
  );
}
