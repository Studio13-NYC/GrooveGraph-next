"use client";

import Link from "next/link";
import { SAMPLE_GRAPH } from "./demo-graphs";
import { KIND_LEGEND, ROUTE_HEX, STATUS_LEGEND } from "./palette";
import { VizSigmaPanel } from "./VizSigmaPanel";

export function VizCheckPage() {
  return (
    <div className="gg-viz-check">
      <header className="gg-viz-check-masthead">
        <p className="gg-viz-check-kicker">Prototype</p>
        <h1 className="gg-viz-check-title">Graph visualization options</h1>
        <p className="gg-viz-check-lede">
          Side-by-side Sigma.js previews using the same mock triplet data as in{" "}
          <strong>docs/GRAPH_VIZ_UX_RESEARCH.md</strong>. Compare baseline styling, kind colors (route
          tokens), status fills, directed arrows with verb labels, and a force-directed layout.
        </p>
        <p className="gg-viz-check-nav">
          <Link href="/">← Research workbench</Link>
        </p>
      </header>

      <section className="gg-viz-check-legends" aria-label="Encoding legends">
        <div className="gg-viz-check-legend">
          <h3>Kind → color (route family)</h3>
          {KIND_LEGEND.map(({ kind }) => (
            <div key={kind} className="gg-viz-check-legend-row">
              <span
                className="gg-viz-check-swatch"
                style={{ background: ROUTE_HEX[kind] ?? ROUTE_HEX.default }}
              />
              <span>{kind}</span>
            </div>
          ))}
        </div>
        <div className="gg-viz-check-legend">
          <h3>Review status (node fill)</h3>
          {STATUS_LEGEND.map(({ status, label }) => (
            <div key={status} className="gg-viz-check-legend-row">
              <span
                className="gg-viz-check-swatch"
                style={{
                  background: status === "accepted" ? "#00933c" : status === "proposed" ? "#111111" : status === "deferred" ? "#8a8583" : "#c4c2c0",
                }}
              />
              <span>
                {label} ({status})
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="gg-viz-check-grid" aria-label="Graph prototypes">
        <VizSigmaPanel
          title="A — Baseline"
          description="Single accent color, circular layout, plain edges (current workbench feel)."
          preset="baseline"
          demo={SAMPLE_GRAPH}
        />
        <VizSigmaPanel
          title="B — Kind colors"
          description="Node fill from provisional kind → NYCTA route hue (see legend)."
          preset="kindColors"
          demo={SAMPLE_GRAPH}
        />
        <VizSigmaPanel
          title="C — Status encoding"
          description="Fill + size by entity review status (border rings need custom Sigma program later)."
          preset="statusEncode"
          demo={SAMPLE_GRAPH}
        />
        <VizSigmaPanel
          title="D — Arrows + verbs"
          description="Directed edges with relationship verb as edge label."
          preset="arrowsLabels"
          demo={SAMPLE_GRAPH}
        />
        <VizSigmaPanel
          title="E — Force layout"
          description="ForceAtlas2 on the same graph + kind colors; organic positions for denser graphs."
          preset="forceLayout"
          demo={SAMPLE_GRAPH}
        />
      </section>
    </div>
  );
}
