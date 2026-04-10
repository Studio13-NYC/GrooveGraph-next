"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DirectedGraph } from "graphology";
import Sigma from "sigma";
import type { ReviewStatus } from "@/src/types/research-session";
import {
  ALL_REVIEW_STATUSES,
  FILTER_STATUS_NEUTRAL_FILL,
  KIND_FILTER_KEYS,
  REVIEW_STATUS_FILTER_ORDER,
  defaultKindFilters,
  kindFamilyHex,
  kindFamilyLabel,
  kindToFillColor,
  passesKindFilters,
  statusToBorderColor,
  statusToGraphNodeRingStroke,
  type KindFamily,
} from "@/src/lib/workbench-viz/graph-viz-styles";
import type {
  WorkbenchGraphFooterSlice,
  WorkbenchVizEdge,
  WorkbenchVizGraph,
  WorkbenchVizNode,
} from "@/src/types/workbench-viz-graph";
import { EmptyState } from "./research-workbench-widgets";

const BASE_NODE_SIZE = 10;
const FOCUSED_NODE_SIZE = 16;
const HOVER_SCALE = 1.14;
const CLICK_DELAY_MS = 280;
const MAX_EDGE_LABELS = 14;
const NARROW_RAIL_MQ = "(max-width: 980px)";
const GRAPH_FILTER_RAIL_COLLAPSED_KEY = "gg-workbench-graph-filter-collapsed";

/** Legend dot for status filters. Accepted = no dot/ring (matches graph: no status ring). */
function StatusFilterSwatch({ status }: { status: ReviewStatus }) {
  if (status === "accepted") {
    return <span className="gg-next-graph-filter-status-swatch gg-next-graph-filter-status-swatch--none" aria-hidden />;
  }
  const ring = statusToBorderColor(status, FILTER_STATUS_NEUTRAL_FILL);
  return (
    <span
      className="gg-next-graph-filter-status-swatch"
      aria-hidden
      style={{
        background: FILTER_STATUS_NEUTRAL_FILL,
        boxShadow: ring ? `inset 0 0 0 2px ${ring}` : undefined,
      }}
    />
  );
}

function KindFilterSwatch({ family }: { family: KindFamily }) {
  return (
    <span
      className="gg-next-graph-filter-kind-swatch"
      aria-hidden
      style={{ background: kindFamilyHex(family) }}
    />
  );
}

function normalizeVizGraph(input: WorkbenchVizGraph): WorkbenchVizGraph {
  const map = new Map(input.nodes.map((n) => [n.id, { ...n, reviewStatus: n.reviewStatus ?? "proposed" }]));
  for (const e of input.edges) {
    if (!map.has(e.source)) {
      map.set(e.source, {
        id: e.source,
        label: `…${e.source.slice(-8)}`,
        subtitle: "unresolved",
        reviewStatus: "proposed",
      });
    }
    if (!map.has(e.target)) {
      map.set(e.target, {
        id: e.target,
        label: `…${e.target.slice(-8)}`,
        subtitle: "unresolved",
        reviewStatus: "proposed",
      });
    }
  }
  return { nodes: [...map.values()], edges: input.edges };
}

/**
 * Edge status for filtering. Session payloads often set every edge to `proposed` even when both
 * endpoints are `accepted`; treating that as literal hides edges under an "accepted only" filter.
 * Trust explicit `accepted` | `rejected` | `deferred` on the edge; otherwise derive from endpoints.
 */
function derivedEdgeReviewStatus(
  e: WorkbenchVizEdge,
  nodeById: Map<string, WorkbenchVizNode>,
): ReviewStatus {
  const fromEndpoints = (): ReviewStatus => {
    const sa = nodeById.get(e.source)?.reviewStatus ?? "proposed";
    const sb = nodeById.get(e.target)?.reviewStatus ?? "proposed";
    if (sa === "rejected" || sb === "rejected") {
      return "rejected";
    }
    if (sa === "deferred" || sb === "deferred") {
      return "deferred";
    }
    if (sa === "accepted" && sb === "accepted") {
      return "accepted";
    }
    return "proposed";
  };

  if (e.reviewStatus && e.reviewStatus !== "proposed") {
    return e.reviewStatus;
  }
  return fromEndpoints();
}

/** Caps NDJSON debug posts (session ee8b37). */
let debugGraphFilterLogN = 0;
let debugRingNearCenterLogN = 0;

/**
 * Intersects nodes by status + entity kind, then keeps edges whose both endpoints survive and
 * whose effective review status passes the status filter.
 */
function filterGraph(
  input: WorkbenchVizGraph,
  allowed: Set<ReviewStatus>,
  includeDeferred: boolean,
  kindFilters: Record<KindFamily, boolean>,
): WorkbenchVizGraph {
  const raw = normalizeVizGraph(input);
  const nodeById = new Map(raw.nodes.map((n) => [n.id, n]));
  const effectiveAllowed = new Set(allowed);
  if (!includeDeferred) {
    effectiveAllowed.delete("deferred");
  }
  const nodes = raw.nodes.filter((n) => {
    const st = n.reviewStatus ?? "proposed";
    return effectiveAllowed.has(st) && passesKindFilters(n.subtitle, kindFilters);
  });
  const ids = new Set(nodes.map((n) => n.id));
  const edges = raw.edges.filter((e) => {
    if (!ids.has(e.source) || !ids.has(e.target)) {
      return false;
    }
    const es = derivedEdgeReviewStatus(e, nodeById);
    return effectiveAllowed.has(es);
  });

  if (typeof window !== "undefined" && debugGraphFilterLogN < 5) {
    let bothEndpointsVisibleDropped = 0;
    let sample: { edgeId: string; derived: ReviewStatus; rawEdgeRs?: ReviewStatus } | null = null;
    for (const e of raw.edges) {
      if (!ids.has(e.source) || !ids.has(e.target)) {
        continue;
      }
      const es = derivedEdgeReviewStatus(e, nodeById);
      if (!effectiveAllowed.has(es)) {
        bothEndpointsVisibleDropped += 1;
        if (!sample) {
          sample = { edgeId: e.id, derived: es, rawEdgeRs: e.reviewStatus };
        }
      }
    }
    const kindsOn = KIND_FILTER_KEYS.filter((k) => kindFilters[k]).length;
    debugGraphFilterLogN += 1;
    // #region agent log
    fetch("http://127.0.0.1:7442/ingest/07c8a0f5-e3ad-4622-9f7f-59e2840edd49", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "ee8b37",
      },
      body: JSON.stringify({
        sessionId: "ee8b37",
        runId: "edge-filter-v1",
        hypothesisId: "H1-edge-rs",
        location: "WorkbenchSigmaGraph.tsx:filterGraph",
        message: "filtered graph counts; both-visible edges dropped by status",
        data: {
          rawEdgeCount: raw.edges.length,
          outNodeCount: nodes.length,
          outEdgeCount: edges.length,
          bothEndpointsVisibleDropped,
          allowedStatuses: [...effectiveAllowed],
          kindsOn,
          sample,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }

  return { nodes, edges };
}

function circlePositions(count: number, radius: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / Math.max(count, 1);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

function buildDirectedSigmaGraph(
  graph: WorkbenchVizGraph,
  focusedNodeId: string | null,
): DirectedGraph {
  const g = new DirectedGraph();
  const n = graph.nodes.length;
  const radius = Math.max(100, Math.min(200, 28 * Math.sqrt(n)));
  const pos = circlePositions(n, radius);

  const focusOffset = (() => {
    if (!focusedNodeId) {
      return { x: 0, y: 0 };
    }
    const idx = graph.nodes.findIndex((node) => node.id === focusedNodeId);
    if (idx < 0) {
      return { x: 0, y: 0 };
    }
    return { x: -pos[idx].x, y: -pos[idx].y };
  })();

  graph.nodes.forEach((node, i) => {
    const fill = kindToFillColor(node.subtitle);
    const size = node.id === focusedNodeId ? FOCUSED_NODE_SIZE : BASE_NODE_SIZE;
    g.addNode(node.id, {
      x: pos[i].x + focusOffset.x,
      y: pos[i].y + focusOffset.y,
      label: node.label,
      size,
      color: fill,
    });
  });

  const edgeColor = "#5a5654";
  const showEdgeLabels = graph.edges.length > 0 && graph.edges.length <= MAX_EDGE_LABELS;

  for (const edge of graph.edges) {
    if (!g.hasNode(edge.source) || !g.hasNode(edge.target)) {
      continue;
    }
    try {
      g.addEdgeWithKey(edge.id, edge.source, edge.target, {
        size: 2,
        color: edgeColor,
        type: "arrow",
        label: showEdgeLabels ? (edge.label ?? undefined) : undefined,
      });
    } catch {
      /* duplicate */
    }
  }

  return g;
}

function drawStatusRings(
  sigma: Sigma,
  graph: DirectedGraph,
  overlay: HTMLCanvasElement,
  nodeMeta: Map<string, { status: ReviewStatus; fill: string }>,
  /** Focused node is translated to graph origin; its status ring reads as a stray black “donut” over the hub. */
  skipRingNodeId: string | null,
) {
  const container = sigma.getContainer();
  const w = container.clientWidth;
  const h = container.clientHeight;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  overlay.width = Math.floor(w * dpr);
  overlay.height = Math.floor(h * dpr);
  overlay.style.width = `${w}px`;
  overlay.style.height = `${h}px`;

  const ctx = overlay.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  ctx.scale(dpr, dpr);

  graph.forEachNode((id) => {
    if (skipRingNodeId && id === skipRingNodeId) {
      return;
    }
    const meta = nodeMeta.get(id);
    if (!meta) {
      return;
    }
    const border = statusToGraphNodeRingStroke(meta.status, meta.fill);
    if (!border) {
      return;
    }
    const disp = sigma.getNodeDisplayData(id);
    if (!disp || disp.hidden) {
      return;
    }
    const pos = sigma.graphToViewport({ x: disp.x, y: disp.y });
    const r = sigma.scaleSize(disp.size);
    const cx = w / 2;
    const cy = h / 2;
    const dist = Math.hypot(pos.x - cx, pos.y - cy);
    if (typeof window !== "undefined" && dist < 52 && debugRingNearCenterLogN < 4) {
      debugRingNearCenterLogN += 1;
      // #region agent log
      fetch("http://127.0.0.1:7442/ingest/07c8a0f5-e3ad-4622-9f7f-59e2840edd49", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "ee8b37",
        },
        body: JSON.stringify({
          sessionId: "ee8b37",
          runId: "ring-near-center-v1",
          hypothesisId: "H3-ring",
          location: "WorkbenchSigmaGraph.tsx:drawStatusRings",
          message: "non-proposed status ring stroke near viewport center",
          data: { nodeId: id, dist: Math.round(dist * 10) / 10, border, skipRingNodeId },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }
    ctx.strokeStyle = border;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r + 2, 0, Math.PI * 2);
    ctx.stroke();
  });
}

export type WorkbenchSigmaGraphHandle = {
  clearFocus: () => void;
};

export type WorkbenchSigmaGraphProps = {
  graph: WorkbenchVizGraph | null;
  dataSource: "typedb" | "session" | null;
  loading: boolean;
  onFooterStateChange?: (slice: WorkbenchGraphFooterSlice) => void;
  /** When this changes (e.g. history index), selection/focus reconcile to the active snapshot. */
  historyResetKey?: string | number;
  /** Single-click (after click vs double-click delay): full node row from the filtered graph. */
  onNodeSelect?: (node: WorkbenchVizNode) => void;
  /**
   * Double-click: request a focused subgraph from the server (parent refetches viz).
   * When set, double-click sets focus to that node instead of toggling it off.
   */
  onNodeFocusRequest?: (nodeId: string) => void;
};

export const WorkbenchSigmaGraph = forwardRef<WorkbenchSigmaGraphHandle, WorkbenchSigmaGraphProps>(
  function WorkbenchSigmaGraph(
    { graph, dataSource, loading, onFooterStateChange, historyResetKey, onNodeSelect, onNodeFocusRequest },
    ref,
  ) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const sigmaRef = useRef<Sigma | null>(null);
    const overlayRef = useRef<HTMLCanvasElement | null>(null);
    const hoverRef = useRef<string | null>(null);
    const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const filterRegionId = useId();
    const filterRailBodyId = useId();
    const onNodeSelectRef = useRef(onNodeSelect);
    onNodeSelectRef.current = onNodeSelect;
    const onNodeFocusRequestRef = useRef(onNodeFocusRequest);
    onNodeFocusRequestRef.current = onNodeFocusRequest;

    const [statusFilter, setStatusFilter] = useState<Record<ReviewStatus, boolean>>({
      proposed: true,
      accepted: true,
      deferred: true,
      rejected: true,
    });
    const [includeDeferred, setIncludeDeferred] = useState(true);
    const [kindFilters, setKindFilters] = useState<Record<KindFamily, boolean>>(defaultKindFilters);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    /** Focus used for layout/rings only when that node is still in the filtered graph (avoids stale hub after kind filter). */
    const focusedNodeIdRef = useRef<string | null>(null);
    const [narrowRail, setNarrowRail] = useState(false);
    const [filterRailCollapsed, setFilterRailCollapsed] = useState(false);

    useImperativeHandle(ref, () => ({
      clearFocus: () => setFocusedNodeId(null),
    }));

    useEffect(() => {
      if (typeof window === "undefined" || !window.matchMedia) {
        return;
      }
      const mq = window.matchMedia(NARROW_RAIL_MQ);
      const apply = () => setNarrowRail(mq.matches);
      apply();
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }, []);

    useEffect(() => {
      try {
        if (localStorage.getItem(GRAPH_FILTER_RAIL_COLLAPSED_KEY) === "1") {
          setFilterRailCollapsed(true);
        }
      } catch {
        /* no-op */
      }
    }, []);

    const toggleFilterRailCollapsed = useCallback(() => {
      setFilterRailCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem(GRAPH_FILTER_RAIL_COLLAPSED_KEY, next ? "1" : "0");
        } catch {
          /* no-op */
        }
        return next;
      });
    }, []);

    const allowedStatuses = useMemo(() => {
      return new Set(ALL_REVIEW_STATUSES.filter((s) => statusFilter[s]));
    }, [statusFilter]);

    const filteredGraph = useMemo(() => {
      if (!graph) {
        return null;
      }
      return filterGraph(graph, allowedStatuses, includeDeferred, kindFilters);
    }, [graph, allowedStatuses, includeDeferred, kindFilters]);

    const filteredGraphRef = useRef(filteredGraph);
    filteredGraphRef.current = filteredGraph;

    const effectiveFocusedNodeId = useMemo(() => {
      if (!focusedNodeId || !filteredGraph) {
        return null;
      }
      return filteredGraph.nodes.some((n) => n.id === focusedNodeId) ? focusedNodeId : null;
    }, [focusedNodeId, filteredGraph]);

    focusedNodeIdRef.current = effectiveFocusedNodeId;

    useEffect(() => {
      if (!filteredGraph) {
        setSelectedNodeId(null);
        setFocusedNodeId(null);
        return;
      }
      const ids = new Set(filteredGraph.nodes.map((n) => n.id));
      setSelectedNodeId((prev) => (prev && ids.has(prev) ? prev : null));
      setFocusedNodeId((prev) => (prev && ids.has(prev) ? prev : null));
    }, [filteredGraph, historyResetKey]);

    const graphBuildKey = useMemo(() => {
      if (!filteredGraph) {
        return "";
      }
      return JSON.stringify({ g: filteredGraph, focus: effectiveFocusedNodeId });
    }, [filteredGraph, effectiveFocusedNodeId]);

    const selectedNode: WorkbenchVizNode | null = useMemo(() => {
      if (!selectedNodeId || !filteredGraph) {
        return null;
      }
      return filteredGraph.nodes.find((n) => n.id === selectedNodeId) ?? null;
    }, [selectedNodeId, filteredGraph]);

    useEffect(() => {
      if (!onFooterStateChange) {
        return;
      }
      if (loading) {
        onFooterStateChange({
          phase: "loading",
          dataSource,
          nodeCount: 0,
          edgeCount: 0,
          filterNote: null,
          selectedNode: null,
          focusedNodeId: null,
        });
        return;
      }
      if (!graph || graph.nodes.length === 0) {
        onFooterStateChange({
          phase: "empty",
          dataSource,
          nodeCount: 0,
          edgeCount: 0,
          filterNote: null,
          selectedNode: null,
          focusedNodeId: null,
        });
        return;
      }
      if (!filteredGraph || filteredGraph.nodes.length === 0) {
        onFooterStateChange({
          phase: "empty-filter",
          dataSource,
          nodeCount: 0,
          edgeCount: 0,
          filterNote: "No nodes match filters",
          selectedNode: null,
          focusedNodeId: null,
        });
        return;
      }
      onFooterStateChange({
        phase: "ready",
        dataSource,
        nodeCount: filteredGraph.nodes.length,
        edgeCount: filteredGraph.edges.length,
        filterNote: null,
        selectedNode: selectedNode
          ? {
              label: selectedNode.label,
              subtitle: selectedNode.subtitle,
              reviewStatus: selectedNode.reviewStatus,
              id: selectedNode.id,
            }
          : null,
        focusedNodeId: effectiveFocusedNodeId,
      });
    }, [
      onFooterStateChange,
      loading,
      graph,
      filteredGraph,
      selectedNode,
      effectiveFocusedNodeId,
      dataSource,
    ]);

    const redrawRings = useCallback(() => {
      const sigma = sigmaRef.current;
      const overlay = overlayRef.current;
      const g = sigma?.getGraph() as DirectedGraph | undefined;
      if (!sigma || !overlay || !g) {
        return;
      }
      const meta = new Map<string, { status: ReviewStatus; fill: string }>();
      g.forEachNode((id) => {
        const raw = filteredGraph?.nodes.find((n) => n.id === id);
        if (!raw) {
          return;
        }
        const status = raw.reviewStatus ?? "proposed";
        meta.set(id, { status, fill: kindToFillColor(raw.subtitle) });
      });
      drawStatusRings(sigma, g, overlay, meta, focusedNodeIdRef.current);
    }, [filteredGraph]);

    useEffect(() => {
      const container = wrapRef.current;
      if (!container || !filteredGraph || filteredGraph.nodes.length === 0) {
        return;
      }

      let overlay = overlayRef.current;
      if (!overlay) {
        overlay = document.createElement("canvas");
        overlay.className = "gg-next-sigma-border-overlay";
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.position = "absolute";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = "2";
        container.style.position = "relative";
        container.appendChild(overlay);
        overlayRef.current = overlay;
      }

      const g = buildDirectedSigmaGraph(filteredGraph, effectiveFocusedNodeId);
      const sigma = new Sigma(g, container, {
        autoRescale: true,
        autoCenter: true,
        stagePadding: 48,
        renderEdgeLabels: filteredGraph.edges.length <= MAX_EDGE_LABELS,
        renderLabels: true,
        labelDensity: 0.08,
        labelGridCellSize: 64,
        labelRenderedSizeThreshold: 4,
        edgeLabelSize: 9,
        zIndex: true,
        defaultEdgeType: "arrow",
        doubleClickZoomingDuration: 0,
        doubleClickZoomingRatio: 1,
        nodeReducer: (node, data) => {
          const id = String(node);
          let size = data.size;
          if (hoverRef.current === id) {
            size *= HOVER_SCALE;
          }
          return { ...data, size };
        },
      });
      sigmaRef.current = sigma;
      let isAlive = true;
      let rafFirst = 0;
      let rafSecond = 0;

      const safeRefresh = () => {
        if (!isAlive || sigmaRef.current !== sigma) {
          return;
        }
        sigma.refresh();
      };

      const onDoubleClickStage = (evt: { preventSigmaDefault?: () => void }) => {
        evt.preventSigmaDefault?.();
      };
      sigma.on("doubleClickStage", onDoubleClickStage);

      const onEnter = ({ node }: { node: string }) => {
        hoverRef.current = node;
        safeRefresh();
        redrawRings();
      };
      const onLeave = () => {
        hoverRef.current = null;
        safeRefresh();
        redrawRings();
      };

      const clearClickTimer = () => {
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
      };

      const onClickNode = ({ node }: { node: string }) => {
        clearClickTimer();
        clickTimerRef.current = setTimeout(() => {
          setSelectedNodeId(node);
          const raw = filteredGraphRef.current?.nodes.find((n) => n.id === node);
          if (raw) {
            onNodeSelectRef.current?.(raw);
          }
          clickTimerRef.current = null;
        }, CLICK_DELAY_MS);
      };

      const onDoubleClickNode = ({ node }: { node: string }) => {
        clearClickTimer();
        setSelectedNodeId(node);
        if (onNodeFocusRequestRef.current) {
          setFocusedNodeId(node);
          onNodeFocusRequestRef.current(node);
        } else {
          setFocusedNodeId((prev) => (prev === node ? null : node));
        }
      };

      const onAfterRender = () => {
        redrawRings();
      };

      sigma.on("enterNode", onEnter);
      sigma.on("leaveNode", onLeave);
      sigma.on("clickNode", onClickNode);
      sigma.on("doubleClickNode", onDoubleClickNode);
      sigma.on("afterRender", onAfterRender);

      const relayout = () => {
        if (!isAlive || sigmaRef.current !== sigma) {
          return;
        }
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (cw <= 0 || ch <= 0) {
          /* Plate height 0 during first layout pass; retry after paint. */
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (!isAlive || sigmaRef.current !== sigma) {
                return;
              }
              const cw2 = container.clientWidth;
              const ch2 = container.clientHeight;
              if (cw2 > 0 && ch2 > 0) {
                sigma.resize();
                safeRefresh();
                redrawRings();
              }
            });
          });
          return;
        }
        sigma.resize();
        safeRefresh();
        redrawRings();
      };
      rafFirst = requestAnimationFrame(() => {
        relayout();
        rafSecond = requestAnimationFrame(() => {
          relayout();
        });
      });

      const ro = new ResizeObserver(() => {
        relayout();
      });
      ro.observe(container);

      redrawRings();

      return () => {
        isAlive = false;
        clearClickTimer();
        if (rafFirst) {
          cancelAnimationFrame(rafFirst);
        }
        if (rafSecond) {
          cancelAnimationFrame(rafSecond);
        }
        ro.disconnect();
        sigma.removeListener("doubleClickStage", onDoubleClickStage);
        sigma.removeListener("enterNode", onEnter);
        sigma.removeListener("leaveNode", onLeave);
        sigma.removeListener("clickNode", onClickNode);
        sigma.removeListener("doubleClickNode", onDoubleClickNode);
        sigma.removeListener("afterRender", onAfterRender);
        sigma.kill();
        sigmaRef.current = null;
        if (overlay?.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        overlayRef.current = null;
      };
    }, [graphBuildKey, filteredGraph, effectiveFocusedNodeId, redrawRings]);

    const toggleStatus = (s: ReviewStatus) => {
      if (!includeDeferred && s === "deferred") {
        return;
      }
      setStatusFilter((prev) => {
        const next = { ...prev, [s]: !prev[s] };
        const count = ALL_REVIEW_STATUSES.filter((x) => next[x]).length;
        if (count === 0) {
          return prev;
        }
        return next;
      });
    };

    const toggleKind = (key: KindFamily) => {
      setKindFilters((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        const count = KIND_FILTER_KEYS.filter((k) => next[k]).length;
        if (count === 0) {
          return prev;
        }
        return next;
      });
    };

    const selectAllKinds = () => {
      setKindFilters(defaultKindFilters());
    };

    const clearAllKinds = () => {
      setKindFilters(
        Object.fromEntries(KIND_FILTER_KEYS.map((k) => [k, false])) as Record<KindFamily, boolean>,
      );
    };

    const filterRailBody = (
      <>
        <div className="gg-next-graph-filter-table" role="group" aria-label="Review status">
          <div className="gg-next-graph-filter-table-cap">
            <span className="gg-next-graph-filter-table-title">Status</span>
            <span className="gg-next-graph-filter-table-sort" aria-hidden>
              ▲
            </span>
          </div>
          {REVIEW_STATUS_FILTER_ORDER.map((s) => (
            <label
              key={s}
              className={`gg-next-graph-filter-table-row${!includeDeferred && s === "deferred" ? " gg-next-graph-filter-table-row--disabled" : ""}`}
            >
              <input
                type="checkbox"
                checked={statusFilter[s]}
                disabled={!includeDeferred && s === "deferred"}
                onChange={() => toggleStatus(s)}
              />
              <StatusFilterSwatch status={s} />
              <span className="gg-next-graph-filter-table-cell" title={s}>
                {s}
              </span>
            </label>
          ))}
          <label className="gg-next-graph-filter-table-row gg-next-graph-filter-table-row--meta">
            <input
              type="checkbox"
              checked={includeDeferred}
              onChange={(event) => {
                const on = event.target.checked;
                setIncludeDeferred(on);
                if (!on) {
                  setStatusFilter((prev) => ({ ...prev, deferred: false }));
                }
              }}
            />
            <span className="gg-next-graph-filter-table-meta-icon" aria-hidden title="Deferred workflow">
              ◇
            </span>
            <span className="gg-next-graph-filter-table-cell">Include deferred</span>
          </label>
        </div>

        <div className="gg-next-graph-filter-table gg-next-graph-filter-table--types" role="group" aria-label="Entity types">
          <div className="gg-next-graph-filter-table-cap gg-next-graph-filter-table-cap--split">
            <span className="gg-next-graph-filter-table-title">Types</span>
            <span className="gg-next-graph-filter-table-actions">
              <button type="button" className="gg-next-graph-filter-link" onClick={selectAllKinds}>
                All
              </button>
              <span className="gg-next-graph-filter-actions-sep" aria-hidden>
                |
              </span>
              <button type="button" className="gg-next-graph-filter-link" onClick={clearAllKinds}>
                None
              </button>
            </span>
          </div>
          <div className="gg-next-graph-filter-table-body gg-next-graph-filter-table-body--types">
            {KIND_FILTER_KEYS.map((key) => (
              <label key={key} className="gg-next-graph-filter-table-row">
                <input
                  type="checkbox"
                  checked={kindFilters[key]}
                  onChange={() => toggleKind(key)}
                />
                <KindFilterSwatch family={key} />
                <span className="gg-next-graph-filter-table-cell" title={kindFamilyLabel(key)}>
                  {kindFamilyLabel(key)}
                </span>
              </label>
            ))}
          </div>
        </div>
      </>
    );

    const filterRailCollapsedBody = (
      <div className="gg-next-graph-filter-rail-collapsed">
        <div className="gg-next-graph-filter-rail-collapsed-group" role="group" aria-label="Review status">
          {REVIEW_STATUS_FILTER_ORDER.map((s) => (
            <label
              key={s}
              className={`gg-next-graph-filter-collapsed-row${!includeDeferred && s === "deferred" ? " gg-next-graph-filter-table-row--disabled" : ""}`}
              title={s}
            >
              <input
                type="checkbox"
                className="gg-next-sr-only"
                checked={statusFilter[s]}
                disabled={!includeDeferred && s === "deferred"}
                onChange={() => toggleStatus(s)}
              />
              <StatusFilterSwatch status={s} />
            </label>
          ))}
        </div>
        <label className="gg-next-graph-filter-collapsed-meta" title="Include deferred in status filter">
          <input
            type="checkbox"
            className="gg-next-sr-only"
            checked={includeDeferred}
            onChange={(event) => {
              const on = event.target.checked;
              setIncludeDeferred(on);
              if (!on) {
                setStatusFilter((prev) => ({ ...prev, deferred: false }));
              }
            }}
          />
          <span className="gg-next-graph-filter-collapsed-meta-label">Def</span>
        </label>
        <div className="gg-next-graph-filter-rail-collapsed-group" role="group" aria-label="Entity types">
          {KIND_FILTER_KEYS.map((key) => (
            <label key={key} className="gg-next-graph-filter-collapsed-row" title={kindFamilyLabel(key)}>
              <input
                type="checkbox"
                className="gg-next-sr-only"
                checked={kindFilters[key]}
                onChange={() => toggleKind(key)}
              />
              <KindFilterSwatch family={key} />
            </label>
          ))}
        </div>
      </div>
    );

    const panelClass = `gg-next-sigma-panel${narrowRail ? " gg-next-sigma-panel--narrow" : ""}`;
    const filterRailClass = ["gg-next-graph-filter-rail", filterRailCollapsed ? "gg-next-graph-filter-rail--collapsed" : ""]
      .filter(Boolean)
      .join(" ");

    const renderSigmaPanel = (canvas: ReactNode) => (
      <div className={panelClass}>
        <div className="gg-next-sigma-panel-main">
          <aside
            id={filterRegionId}
            className={filterRailClass}
            aria-label="Graph filters"
            role="region"
          >
            <div className="gg-next-graph-filter-rail-toolbar">
              <button
                type="button"
                className="gg-next-rail-toggle"
                onClick={toggleFilterRailCollapsed}
                aria-expanded={!filterRailCollapsed}
                aria-controls={filterRailBodyId}
                title={filterRailCollapsed ? "Expand filters" : "Collapse filters to rail"}
              >
                <span className="gg-next-rail-toggle-icon" aria-hidden>
                  {filterRailCollapsed ? "»" : "«"}
                </span>
                <span className="gg-next-sr-only">
                  {filterRailCollapsed ? "Expand graph filters" : "Collapse graph filters"}
                </span>
              </button>
            </div>
            <div id={filterRailBodyId} className="gg-next-graph-filter-rail-body">
              {filterRailCollapsed ? (
                filterRailCollapsedBody
              ) : (
                <div className="gg-next-graph-filter-rail-inner">{filterRailBody}</div>
              )}
            </div>
          </aside>
          <div className="gg-next-sigma-canvas-column">{canvas}</div>
        </div>
      </div>
    );

    if (loading) {
      return renderSigmaPanel(
        <div className="gg-next-sigma-canvas-wrap gg-next-sigma-canvas-wrap--loading" aria-busy="true" />,
      );
    }

    if (!graph || graph.nodes.length === 0) {
      return renderSigmaPanel(
        <EmptyState
          className="gg-next-sigma-empty"
          text="No nodes to draw yet. Entities and relationships appear here as the session graph is populated."
        />,
      );
    }

    if (!filteredGraph || filteredGraph.nodes.length === 0) {
      return renderSigmaPanel(
        <EmptyState
          className="gg-next-sigma-empty"
          text="Adjust filters — check entity types, status, or include deferred items."
        />,
      );
    }

    return renderSigmaPanel(
      <div
        ref={wrapRef}
        className="gg-next-sigma-canvas-wrap"
        role="img"
        aria-label={`Relationship graph: ${filteredGraph.nodes.length} nodes, ${filteredGraph.edges.length} edges. Single-click a node for details; double-click to focus.`}
      />,
    );
  },
);

WorkbenchSigmaGraph.displayName = "WorkbenchSigmaGraph";
