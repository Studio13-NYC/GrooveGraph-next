"use client";

import { useEffect, useMemo, useRef } from "react";
import { DirectedGraph } from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import Sigma from "sigma";
import type { VizDemoGraph } from "./demo-graphs";
import { kindToColor, statusToNodeStyle } from "./palette";

export type VizSigmaPreset =
  | "baseline"
  | "kindColors"
  | "statusEncode"
  | "arrowsLabels"
  | "forceLayout";

type Props = {
  title: string;
  description: string;
  preset: VizSigmaPreset;
  demo: VizDemoGraph;
};

const EDGE_DEFAULT = "#5a5654";
const EDGE_MUTED = "#a7a9ac";

function circleLayout(n: number, radius: number) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

function buildGraph(demo: VizDemoGraph, preset: VizSigmaPreset): DirectedGraph {
  const g = new DirectedGraph();
  const n = demo.nodes.length;
  const radius = Math.max(80, Math.min(140, 22 * Math.sqrt(n)));
  const positions = circleLayout(n, radius);

  demo.nodes.forEach((node, i) => {
    let color = "#ff6319";
    let size = 10;
    if (preset === "baseline") {
      color = "#ff6319";
      size = 10;
    } else if (preset === "kindColors" || preset === "arrowsLabels") {
      color = kindToColor(node.kind);
      size = 10;
    } else if (preset === "statusEncode") {
      const s = statusToNodeStyle(node.status);
      color = s.color;
      size = s.size;
    } else if (preset === "forceLayout") {
      color = kindToColor(node.kind);
      size = 10;
    }

    const x = preset === "forceLayout" ? Math.random() * 200 - 100 : positions[i].x;
    const y = preset === "forceLayout" ? Math.random() * 200 - 100 : positions[i].y;

    g.addNode(node.id, {
      x,
      y,
      label: node.label,
      size,
      color,
    });
  });

  const useArrow = preset === "arrowsLabels" || preset === "forceLayout";
  const showEdgeLabels = preset === "arrowsLabels";

  for (const edge of demo.edges) {
    if (!g.hasNode(edge.source) || !g.hasNode(edge.target)) {
      continue;
    }
    try {
      const ec =
        preset === "statusEncode"
          ? statusToNodeStyle(edge.status).color === "#c4c2c0"
            ? EDGE_MUTED
            : EDGE_DEFAULT
          : EDGE_DEFAULT;

      g.addEdgeWithKey(edge.id, edge.source, edge.target, {
        size: 2,
        color: ec,
        type: useArrow ? "arrow" : "line",
        label: showEdgeLabels ? edge.verb : undefined,
      });
    } catch {
      /* duplicate */
    }
  }

  if (preset === "forceLayout") {
    forceAtlas2.assign(g, {
      iterations: 120,
      settings: forceAtlas2.inferSettings(g),
    });
  }

  return g;
}

export function VizSigmaPanel({ title, description, preset, demo }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const key = useMemo(() => `${preset}-${JSON.stringify(demo)}`, [preset, demo]);

  useEffect(() => {
    const container = wrapRef.current;
    if (!container) {
      return;
    }

    const g = buildGraph(demo, preset);
    const sigma = new Sigma(g, container, {
      renderEdgeLabels: preset === "arrowsLabels",
      renderLabels: true,
      labelDensity: 0.12,
      labelGridCellSize: 55,
      labelRenderedSizeThreshold: 4,
      edgeLabelSize: 10,
      zIndex: true,
      defaultEdgeType: preset === "arrowsLabels" || preset === "forceLayout" ? "arrow" : "line",
    });

    const ro = new ResizeObserver(() => sigma.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      sigma.kill();
    };
  }, [key, preset, demo]);

  return (
    <article className="gg-viz-check-card">
      <header className="gg-viz-check-card-head">
        <h2 className="gg-viz-check-card-title">{title}</h2>
        <p className="gg-viz-check-card-desc">{description}</p>
      </header>
      <div
        ref={wrapRef}
        className="gg-viz-check-canvas"
        role="img"
        aria-label={`${title}: sample graph preview`}
      />
    </article>
  );
}
