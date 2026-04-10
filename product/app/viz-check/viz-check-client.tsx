"use client";

import dynamic from "next/dynamic";

const VizCheckPage = dynamic(
  () => import("@/src/components/viz-check/VizCheckPage").then((m) => m.VizCheckPage),
  {
    ssr: false,
    loading: () => (
      <div className="gg-viz-check">
        <p className="gg-viz-check-lede">Loading visualization prototypes…</p>
      </div>
    ),
  },
);

export function VizCheckClientRoot() {
  return <VizCheckPage />;
}
