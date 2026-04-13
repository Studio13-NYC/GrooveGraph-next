"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { WorkspaceResponse } from "@/src/components/research-workbench-model";
import { fetchJson } from "@/src/components/research-workbench-utils";
import { workbenchVizToAtlasLineageGraph } from "@/src/lib/workbench-viz/workbench-viz-to-atlas-lineage";
import type { ResearchSession } from "@/src/types/research-session";
import type { AtlasDemoNode, AtlasSchemaKind } from "@/src/types/atlas-lineage";
import type { WorkbenchVizApiResponse } from "@/src/types/workbench-viz-graph";
import {
  ATLAS_LINEAGE_FULL,
  applyAtlasFilters,
  extractAtlasLineageNeighborhood,
  type AtlasDataMode,
  type AtlasViewMode,
} from "./atlas-lineage-demo-data";
import { AtlasKindMultiselect } from "./AtlasKindMultiselect";
import {
  AtlasLineageGraph,
  type AtlasLineageGraphHandle,
} from "./AtlasLineageGraph";

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

function IconSearch() {
  return (
    <svg className="gg-atlas-lineage__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function AtlasLineagePage() {
  const graphRef = useRef<AtlasLineageGraphHandle>(null);
  const primaryModalBtnRef = useRef<HTMLButtonElement>(null);

  const [onboarding, setOnboarding] = useState(false);
  const [viewMode, setViewMode] = useState<AtlasViewMode>("full");
  const [kinds, setKinds] = useState<AtlasSchemaKind[]>([]);
  const [search, setSearch] = useState("");
  const [showOrganizations, setShowOrganizations] = useState(true);
  const [showSources, setShowSources] = useState(true);
  const [lightTheme, setLightTheme] = useState(false);

  const [dataMode, setDataMode] = useState<AtlasDataMode>("typedb_global");
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [vizLoading, setVizLoading] = useState(false);
  const [vizError, setVizError] = useState<string | null>(null);
  const [vizSource, setVizSource] = useState<"typedb" | "session" | null>(null);
  const [vizRaw, setVizRaw] = useState<WorkbenchVizApiResponse["graph"] | null>(null);
  /** One-hop neighborhood focus (server-side for session/TypeDB, client-side for demo). */
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  const [newSessionSeed, setNewSessionSeed] = useState("");
  const [createSessionBusy, setCreateSessionBusy] = useState(false);
  const [createSessionError, setCreateSessionError] = useState<string | null>(null);

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

  const handleCreateSession = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = newSessionSeed.trim();
      if (!trimmed || createSessionBusy) {
        return;
      }
      setCreateSessionBusy(true);
      setCreateSessionError(null);
      try {
        const data = await fetchJson<WorkspaceResponse>("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seedQuery: trimmed }),
        });
        const created = data.session;
        setSessions((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
        setNewSessionSeed("");
        setSessionId(created.id);
        setDataMode("session");
        setKinds([]);
        setFocusNodeId(null);
      } catch (err: unknown) {
        setCreateSessionError(err instanceof Error ? err.message : "Failed to create session.");
      } finally {
        setCreateSessionBusy(false);
      }
    },
    [newSessionSeed, createSessionBusy],
  );

  useEffect(() => {
    setFocusNodeId(null);
  }, [dataMode, sessionId]);

  useEffect(() => {
    if (dataMode === "demo") {
      setVizRaw(null);
      setVizError(null);
      setVizSource(null);
      setVizLoading(false);
      return;
    }

    if (dataMode === "session" && !sessionId) {
      setVizRaw(null);
      setVizError(null);
      setVizSource(null);
      setVizLoading(false);
      return;
    }

    let cancelled = false;
    setVizLoading(true);
    setVizError(null);

    const focusQs = focusNodeId ? `?focusNodeId=${encodeURIComponent(focusNodeId)}` : "";
    const vizUrl =
      dataMode === "typedb_global"
        ? `/api/graph/viz${focusQs}`
        : `/api/sessions/${encodeURIComponent(sessionId as string)}/graph/viz${focusQs}`;

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
        setVizSource(body.source);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVizRaw(null);
        setVizSource(null);
        setVizError(err instanceof Error ? err.message : "Failed to load graph");
      })
      .finally(() => {
        if (!cancelled) {
          setVizLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dataMode, sessionId, focusNodeId]);

  const baseGraph = useMemo(() => {
    if (dataMode === "demo") {
      if (!focusNodeId) {
        return ATLAS_LINEAGE_FULL;
      }
      return extractAtlasLineageNeighborhood(ATLAS_LINEAGE_FULL, focusNodeId) ?? ATLAS_LINEAGE_FULL;
    }
    if (!vizRaw) {
      return workbenchVizToAtlasLineageGraph({ nodes: [], edges: [] });
    }
    return workbenchVizToAtlasLineageGraph(vizRaw);
  }, [dataMode, vizRaw, focusNodeId]);

  const handleNodeClick = useCallback((node: AtlasDemoNode) => {
    setFocusNodeId(node.id);
  }, []);

  const filtered = useMemo(
    () =>
      applyAtlasFilters(baseGraph, {
        viewMode,
        kinds,
        search,
        showOrganizations,
        showSources,
        dataMode,
      }),
    [baseGraph, viewMode, kinds, search, showOrganizations, showSources, dataMode],
  );

  useEffect(() => {
    if (!onboarding) return;
    const t = window.setTimeout(() => primaryModalBtnRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [onboarding]);

  useEffect(() => {
    if (!onboarding) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOnboarding(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onboarding]);

  const startEssential = useCallback(() => {
    setViewMode("essential");
    setOnboarding(false);
  }, []);

  const startFull = useCallback(() => {
    setViewMode("full");
    setOnboarding(false);
  }, []);

  const onDataModeChange = useCallback((next: AtlasDataMode) => {
    setDataMode(next);
    setKinds([]);
    setFocusNodeId(null);
  }, []);

  const orgChipLabel = dataMode === "demo" ? "Organizations" : "People & orgs";
  const srcChipLabel = dataMode === "demo" ? "Sources" : "Media & gear";
  const showSessionControls = dataMode === "session";
  const showVizStatus = dataMode === "session" || dataMode === "typedb_global";
  const liveGraphTarget =
    dataMode === "typedb_global" || (dataMode === "session" && Boolean(sessionId));
  const graphStageLoading = liveGraphTarget && vizLoading && !vizRaw;
  const graphStageError = liveGraphTarget && !vizRaw && Boolean(vizError);
  const graphStagePickSession = dataMode === "session" && !sessionId;

  const emptyLiveGraphMessage =
    liveGraphTarget &&
    vizRaw &&
    baseGraph.nodes.length === 0 &&
    filtered.nodes.length === 0
      ? "No graph entities in this scope. Add entities in the workbench or choose another session or data source."
      : undefined;

  const rootClass = lightTheme ? "gg-atlas-lineage gg-atlas-lineage--light" : "gg-atlas-lineage";

  return (
    <div className={rootClass}>
      <header className="gg-atlas-lineage__header">
        <Link href="/main" className="gg-atlas-lineage__brand">
          <p className="gg-atlas-lineage__kicker">GrooveGraph</p>
          <p className="gg-atlas-lineage__title">Lineage explorer</p>
        </Link>
        <nav className="gg-atlas-lineage__nav" aria-label="Prototype navigation">
          <Link className="gg-atlas-lineage__pill" href="/main">
            Workbench
          </Link>
          <Link className="gg-atlas-lineage__pill" href="/viz-check">
            Viz check
          </Link>
          <button
            type="button"
            className="gg-atlas-lineage__pill"
            onClick={() => setOnboarding(true)}
          >
            Starting view…
          </button>
        </nav>
      </header>

      <div
        className={`gg-atlas-lineage__backdrop ${onboarding ? "gg-atlas-lineage__backdrop--open" : ""}`}
        aria-hidden={!onboarding}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOnboarding(false);
        }}
      >
        {onboarding ? (
          <div
            className="gg-atlas-lineage__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="atlas-onboarding-title"
          >
            <h2 id="atlas-onboarding-title" className="gg-atlas-lineage__modal-title">
              Choose your starting view
            </h2>
            <p className="gg-atlas-lineage__modal-body">
              Use <strong>Entire database</strong> to load every workbench entity in TypeDB (no session pick). Use{" "}
              <strong>Live session</strong> for one session’s graph. Use <strong>Demo graph</strong> for the offline sample.
              Refine with the type filter and <span className="gg-atlas-lineage__modal-tag">search</span> above the canvas.
            </p>
            <div className="gg-atlas-lineage__modal-actions">
              <button
                ref={primaryModalBtnRef}
                type="button"
                className="gg-atlas-lineage__btn-primary"
                onClick={startEssential}
              >
                Essentials only
                <span className="gg-atlas-lineage__btn-caption">Accepted entities &amp; key links</span>
              </button>
              <button type="button" className="gg-atlas-lineage__btn-secondary" onClick={startFull}>
                Full graph
                <span className="gg-atlas-lineage__btn-caption">Everything in scope</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="gg-atlas-lineage__data-strip" role="region" aria-label="Data source">
        <label htmlFor="atlas-data-mode" className="sr-only">
          Graph data source
        </label>
        <select
          id="atlas-data-mode"
          className="gg-atlas-lineage__select gg-atlas-lineage__select--data"
          value={dataMode}
          onChange={(e) => onDataModeChange(e.target.value as AtlasDataMode)}
        >
          <option value="typedb_global">Entire database (TypeDB)</option>
          <option value="session">Live session (TypeDB / session)</option>
          <option value="demo">Demo graph (offline)</option>
        </select>
        {showSessionControls ? (
          <>
            <label htmlFor="atlas-session" className="sr-only">
              Research session
            </label>
            <select
              id="atlas-session"
              className="gg-atlas-lineage__select gg-atlas-lineage__select--session"
              value={sessionId ?? ""}
              onChange={(e) => setSessionId(e.target.value || null)}
            >
              {sessions.length === 0 ? (
                <option value="">No sessions — create one in Workbench</option>
              ) : (
                <>
                  <option value="">Select session…</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {(s.title || s.seedQuery || s.id).slice(0, 72)}
                    </option>
                  ))}
                </>
              )}
            </select>
          </>
        ) : null}
        {showVizStatus ? (
          <>
            {vizSource ? (
              <span className="gg-atlas-lineage__source-badge" title="Graph payload origin">
                Source: {vizSource === "typedb" ? "TypeDB" : "Session file"}
              </span>
            ) : null}
            {vizLoading ? <span className="gg-atlas-lineage__status">Loading…</span> : null}
            {vizError ? (
              <span className="gg-atlas-lineage__status gg-atlas-lineage__status--error" role="alert">
                {vizError}
              </span>
            ) : null}
            {focusNodeId ? (
              <button
                type="button"
                className="gg-atlas-lineage__focus-clear"
                onClick={() => setFocusNodeId(null)}
              >
                Clear focus (full graph)
              </button>
            ) : null}
          </>
        ) : focusNodeId ? (
          <button
            type="button"
            className="gg-atlas-lineage__focus-clear"
            onClick={() => setFocusNodeId(null)}
          >
            Clear focus (full graph)
          </button>
        ) : null}
      </div>

      <form
        className="gg-atlas-lineage__new-session-strip"
        role="region"
        aria-label="New research session"
        onSubmit={(e) => void handleCreateSession(e)}
      >
        <p className="gg-atlas-lineage__new-session-kicker">New query</p>
        <label htmlFor="atlas-new-session-seed" className="sr-only">
          Seed query for a new research session
        </label>
        <input
          id="atlas-new-session-seed"
          className="gg-atlas-lineage__new-session-input"
          value={newSessionSeed}
          onChange={(e) => {
            setNewSessionSeed(e.target.value);
            if (createSessionError) setCreateSessionError(null);
          }}
          placeholder="Artist, URL, question…"
          autoComplete="off"
          disabled={createSessionBusy}
        />
        <button
          type="submit"
          className="gg-atlas-lineage__btn-create-session"
          disabled={createSessionBusy || !newSessionSeed.trim()}
        >
          {createSessionBusy ? "Creating…" : "Create session"}
        </button>
        <Link href="/main" className="gg-atlas-lineage__new-session-link">
          Open workbench
        </Link>
        {createSessionError ? (
          <p className="gg-atlas-lineage__new-session-error" role="alert">
            {createSessionError}
          </p>
        ) : null}
      </form>

      <div className="gg-atlas-lineage__filter-strip" role="toolbar" aria-label="Graph filters">
        <span className="sr-only" id="atlas-kind-label">
          Filter by entity type (multi-select)
        </span>
        <AtlasKindMultiselect
          aria-labelledby="atlas-kind-label"
          variant={dataMode === "demo" ? "demo" : "live"}
          value={kinds}
          onChange={setKinds}
        />
        <button
          type="button"
          className={`gg-atlas-lineage__chip ${showOrganizations ? "gg-atlas-lineage__chip--on" : ""}`}
          onClick={() => setShowOrganizations((v) => !v)}
          aria-pressed={showOrganizations}
        >
          {orgChipLabel} {showOrganizations ? "✓" : ""}
        </button>
        <button
          type="button"
          className={`gg-atlas-lineage__chip ${showSources ? "gg-atlas-lineage__chip--on" : ""}`}
          onClick={() => setShowSources((v) => !v)}
          aria-pressed={showSources}
        >
          {srcChipLabel} {showSources ? "✓" : ""}
        </button>
        <div className="gg-atlas-lineage__search-wrap">
          <IconSearch />
          <label htmlFor="atlas-search" className="sr-only">
            Search nodes
          </label>
          <input
            id="atlas-search"
            className="gg-atlas-lineage__search-input"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <main className="gg-atlas-lineage__main">
        <div className="gg-atlas-lineage__stage-wrap">
          {graphStagePickSession ? (
            <div className="gg-atlas-lineage__empty" role="status">
              Select a research session above, or choose <strong>Entire database</strong> to load all workbench entities
              from TypeDB.
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
      </main>
    </div>
  );
}
