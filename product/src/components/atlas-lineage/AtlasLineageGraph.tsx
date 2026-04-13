"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { drag } from "d3-drag";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceY,
} from "d3-force";
import type { SimulationNodeDatum } from "d3-force";
import { pointer, select } from "d3-selection";
import {
  zoom,
  zoomIdentity,
  type ZoomBehavior,
  type ZoomTransform,
} from "d3-zoom";
import type { AtlasDemoEdge, AtlasDemoGraph, AtlasDemoNode, AtlasPhase } from "@/src/types/atlas-lineage";
import { atlasKindColor } from "./atlas-lineage-demo-data";

type SimNode = AtlasDemoNode &
  SimulationNodeDatum & {
    fx?: number | null;
    fy?: number | null;
  };

type SimLink = {
  id: string;
  source: SimNode | string;
  target: SimNode | string;
  verb: string;
  ended?: boolean;
};

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3.5;

function toSimLinks(edges: AtlasDemoEdge[], nodeById: Map<string, SimNode>): SimLink[] {
  return edges.map((e) => ({
    id: e.id,
    source: nodeById.get(e.source)!,
    target: nodeById.get(e.target)!,
    verb: e.verb,
    ended: e.ended,
  }));
}

function readAtlasVars(root: Element | null): {
  edge: string;
  edgeHover: string;
  fg: string;
  muted: string;
  laneLine: string;
  labelFill: string;
  labelStroke: string;
} {
  const el = root?.closest(".gg-atlas-lineage") ?? root;
  const cs = el ? getComputedStyle(el as Element) : null;
  const pick = (name: string, fallback: string) =>
    (cs?.getPropertyValue(name).trim() || fallback).replace(/^["']|["']$/g, "");
  return {
    edge: pick("--atlas-edge", "rgba(156,163,175,0.45)"),
    edgeHover: pick("--atlas-accent", "#e8943c"),
    fg: pick("--atlas-fg", "#e8e8ec"),
    muted: pick("--atlas-fg-muted", "#9ca3af"),
    laneLine: pick("--atlas-lane-divider", "rgba(156,163,175,0.35)"),
    labelFill: pick("--atlas-fg", "#e8e8ec"),
    labelStroke: pick("--atlas-label-stroke", "#0c0c0e"),
  };
}

export type AtlasLineageGraphHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
};

export const AtlasLineageGraph = forwardRef<
  AtlasLineageGraphHandle,
  {
    graph: AtlasDemoGraph;
    onNodeClick?: (node: AtlasDemoNode) => void;
    /** Shown when `graph.nodes` is empty (e.g. API returned no entities). Overrides filter-empty copy. */
    emptyGraphMessage?: string;
  }
>(function AtlasLineageGraph({ graph, onNodeClick, emptyGraphMessage }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  const zoomBehRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const initialTransformRef = useRef<ZoomTransform | null>(null);
  const onNodeClickRef = useRef(onNodeClick);
  onNodeClickRef.current = onNodeClick;

  const run = useCallback(() => {
    const host = hostRef.current;
    const svgEl = svgRef.current;
    if (!host || !svgEl || graph.nodes.length === 0) return;

    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width < 32 || height < 32) return;

    const phases: AtlasPhase[] = [...graph.phases].sort((a, b) => a.order - b.order);
    const laneCount = Math.max(1, phases.length);
    const margin = { top: 44, bottom: 36, left: 108, right: 28 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const vars = readAtlasVars(host);

    const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const links = toSimLinks(
      graph.edges.filter((e) => nodeById.has(e.source) && nodeById.has(e.target)),
      nodeById,
    );

    const laneCenters: number[] = [];
    for (let i = 0; i < laneCount; i++) {
      laneCenters.push(margin.top + ((i + 0.5) / laneCount) * innerH);
    }

    select(svgEl).selectAll("*").remove();
    const svg = select(svgEl).attr("width", width).attr("height", height);
    const rootG = svg.append("g").attr("class", "atlas-zoom-root");

    const zoomBeh = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .on("zoom", (event) => {
        rootG.attr("transform", event.transform.toString());
      });
    zoomBehRef.current = zoomBeh;
    svg.call(zoomBeh);
    const initial = zoomIdentity.translate(width * 0.04, height * 0.04).scale(0.92);
    initialTransformRef.current = initial;
    svg.call(zoomBeh.transform, initial);

    const g = rootG.append("g").attr("transform", `translate(${margin.left},0)`);

    for (let i = 1; i < laneCount; i++) {
      const y = margin.top + (i / laneCount) * innerH;
      g.append("line")
        .attr("class", "atlas-lane-divider")
        .attr("x1", -margin.left)
        .attr("x2", innerW + margin.right)
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", vars.laneLine)
        .attr("stroke-dasharray", "4,4")
        .attr("opacity", 0.85);
    }

    const labelG = g.append("g").attr("class", "atlas-phase-labels").style("pointer-events", "none");
    phases.forEach((ph, i) => {
      const y = laneCenters[i] ?? margin.top + innerH / 2;
      const sub = ph.endYear == null ? `${ph.startYear}–present` : `${ph.startYear}–${ph.endYear}`;
      const ty = -10;
      const mono = 'var(--atlas-mono, ui-monospace, monospace)';
      labelG
        .append("text")
        .attr("x", -margin.left + 12)
        .attr("y", y + ty)
        .attr("font-family", mono)
        .attr("font-size", width < 640 ? 11 : 13)
        .attr("dominant-baseline", "middle")
        .attr("stroke", vars.labelStroke)
        .attr("stroke-width", 5)
        .attr("stroke-linejoin", "round")
        .text(ph.name);
      labelG
        .append("text")
        .attr("x", -margin.left + 12)
        .attr("y", y + ty)
        .attr("font-family", mono)
        .attr("font-size", width < 640 ? 11 : 13)
        .attr("fill", vars.labelFill)
        .attr("dominant-baseline", "middle")
        .text(ph.name);
      labelG
        .append("text")
        .attr("x", -margin.left + 12)
        .attr("y", y + 14)
        .attr("font-family", mono)
        .attr("font-size", width < 640 ? 9 : 11)
        .attr("fill", vars.muted)
        .attr("dominant-baseline", "middle")
        .text(sub);
    });

    nodes.forEach((n) => {
      const y = laneCenters[n.lane] ?? laneCenters[0]!;
      n.x = margin.left + innerW * 0.35 + Math.random() * innerW * 0.25;
      n.y = y + (Math.random() - 0.5) * (innerH / laneCount) * 0.35;
    });

    const sim = forceSimulation<SimNode>(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(72)
          .strength(0.55),
      )
      .force("charge", forceManyBody<SimNode>().strength(-220))
      .force(
        "y",
        forceY<SimNode>((d) => laneCenters[d.lane] ?? laneCenters[0]!).strength(0.18),
      )
      .force("collide", forceCollide<SimNode>().radius(36));

    simRef.current = sim;

    if (window.matchMedia("(pointer: coarse)").matches) {
      sim.stop();
      for (let i = 0; i < 180; i++) sim.tick();
      sim.restart();
    }

    const edgesG = g.append("g").attr("class", "atlas-edges");
    const edgeSel = edgesG
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links, (d) => d.id)
      .join("line")
      .attr("stroke", vars.edge)
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.55)
      .attr("stroke-dasharray", (d) => (d.ended ? "4,4" : "none"));

    const nodesG = g.append("g").attr("class", "atlas-nodes");
    const nodeG = nodesG
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes, (d) => d.id)
      .join("g")
      .style("cursor", "grab");

    const dragStartClient = new WeakMap<SimNode, [number, number]>();
    const clientFromSource = (ev: Event): [number, number] => {
      if ("clientX" in ev && typeof (ev as MouseEvent).clientX === "number") {
        const m = ev as MouseEvent;
        return [m.clientX, m.clientY];
      }
      const t = (ev as TouchEvent).changedTouches?.[0];
      return t ? [t.clientX, t.clientY] : [0, 0];
    };

    const dragBeh = drag<SVGGElement, SimNode>()
      .on("start", (event, d) => {
        dragStartClient.set(d, clientFromSource(event.sourceEvent));
        if (!event.active) sim.alphaTarget(0.35).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        const [px, py] = pointer(event, g.node());
        d.fx = px;
        d.fy = py;
      })
      .on("end", (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        const start = dragStartClient.get(d);
        dragStartClient.delete(d);
        const [cx, cy] = clientFromSource(event.sourceEvent);
        if (start && onNodeClickRef.current) {
          const dx = cx - start[0];
          const dy = cy - start[1];
          if (dx * dx + dy * dy < 100) {
            onNodeClickRef.current(d);
          }
        }
      });

    nodeG.call(dragBeh as never);

    nodeG
      .append("circle")
      .attr("r", (d) => (d.essential ? 14 : 11))
      .attr("fill", (d) => atlasKindColor(d.kind))
      .attr("stroke", "none")
      .attr("title", "Click (without dragging) to show this entity and its connections");

    nodeG
      .append("text")
      .attr("x", (d) => (d.essential ? 18 : 15))
      .attr("y", 4)
      .attr("font-size", (d) => (d.essential ? 13 : 12))
      .attr("font-weight", 700)
      .attr("font-family", 'var(--gg-font-sans, system-ui, sans-serif)')
      .attr("fill", vars.fg)
      .attr("pointer-events", "none")
      .text((d) => d.label);

    function applyHover(id: string | null) {
      const keep = new Set<string>();
      if (id) {
        keep.add(id);
        links.forEach((l) => {
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          if (s === id || t === id) {
            keep.add(s);
            keep.add(t);
          }
        });
      }
      nodeG.transition().duration(150).style("opacity", (d) => (id && !keep.has(d.id) ? 0.14 : 1));
      edgeSel
        .transition()
        .duration(150)
        .attr("stroke", (d) => {
          const s = typeof d.source === "object" ? d.source.id : d.source;
          const t = typeof d.target === "object" ? d.target.id : d.target;
          const hit = id && (s === id || t === id);
          return hit ? vars.edgeHover : vars.edge;
        })
        .attr("stroke-opacity", (d) => {
          const s = typeof d.source === "object" ? d.source.id : d.source;
          const t = typeof d.target === "object" ? d.target.id : d.target;
          const hit = id && (s === id || t === id);
          return hit ? 0.95 : 0.35;
        })
        .attr("stroke-width", (d) => {
          const s = typeof d.source === "object" ? d.source.id : d.source;
          const t = typeof d.target === "object" ? d.target.id : d.target;
          const hit = id && (s === id || t === id);
          return hit ? 1.4 : 1;
        });
    }

    nodeG
      .on("mouseenter", (_e, d) => applyHover(d.id))
      .on("mouseleave", () => applyHover(null));

    sim.on("tick", () => {
      edgeSel
        .attr("x1", (d) => (typeof d.source === "object" ? d.source.x! : 0))
        .attr("y1", (d) => (typeof d.source === "object" ? d.source.y! : 0))
        .attr("x2", (d) => (typeof d.target === "object" ? d.target.x! : 0))
        .attr("y2", (d) => (typeof d.target === "object" ? d.target.y! : 0));
      nodeG.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });
  }, [graph]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const svg = svgRef.current;
      const z = zoomBehRef.current;
      if (!svg || !z) return;
      select(svg).transition().duration(180).call(z.scaleBy, 1.18);
    },
    zoomOut: () => {
      const svg = svgRef.current;
      const z = zoomBehRef.current;
      if (!svg || !z) return;
      select(svg).transition().duration(180).call(z.scaleBy, 1 / 1.18);
    },
    resetView: () => {
      const svg = svgRef.current;
      const z = zoomBehRef.current;
      const t = initialTransformRef.current;
      if (!svg || !z || !t) return;
      select(svg).transition().duration(280).call(z.transform, t);
    },
  }));

  useEffect(() => {
    run();
    const ro = new ResizeObserver(() => run());
    if (hostRef.current) ro.observe(hostRef.current);
    return () => {
      ro.disconnect();
      simRef.current?.stop();
      simRef.current = null;
      if (svgRef.current) select(svgRef.current).on(".zoom", null).selectAll("*").remove();
    };
  }, [run]);

  if (graph.nodes.length === 0) {
    return (
      <div className="gg-atlas-lineage__empty" role="status">
        {emptyGraphMessage ??
          "No nodes match the current filters. Adjust filters or search."}
      </div>
    );
  }

  return (
    <div ref={hostRef} className="gg-atlas-lineage__graph-host">
      <svg ref={svgRef} aria-hidden />
    </div>
  );
});

AtlasLineageGraph.displayName = "AtlasLineageGraph";
