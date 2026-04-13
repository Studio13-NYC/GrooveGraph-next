import {
  provisionalKindToFamily,
  type KindFamily,
} from "@/src/lib/workbench-viz/graph-viz-styles";
import type {
  AtlasDemoEdge,
  AtlasDemoGraph,
  AtlasDemoNode,
  AtlasPhase,
} from "@/src/types/atlas-lineage";
import type { WorkbenchVizGraph } from "@/src/types/workbench-viz-graph";

/** Lanes for D3 force-Y: group families into three horizontal bands. */
const LANE_BY_FAMILY: Record<KindFamily, number> = {
  people: 0,
  labels: 0,
  studios: 1,
  recordings: 1,
  genres: 2,
  gear: 2,
  other: 1,
};

/** Phase labels when visualizing a live session graph (TypeDB or session JSON). */
export const ATLAS_SESSION_PHASES: AtlasPhase[] = [
  {
    id: "sp0",
    name: "People & labels",
    startYear: 2024,
    endYear: 2025,
    order: 0,
  },
  {
    id: "sp1",
    name: "Studios & recordings",
    startYear: 2025,
    endYear: 2026,
    order: 1,
  },
  {
    id: "sp2",
    name: "Genres & gear",
    startYear: 2026,
    endYear: null,
    order: 2,
  },
];

/**
 * Maps workbench viz (from `/api/sessions/:id/graph/viz`) into atlas-lineage D3 DTOs.
 * Entity kind comes from `subtitle` (provisional-entity-kind) via {@link provisionalKindToFamily}.
 */
export function workbenchVizToAtlasLineageGraph(viz: WorkbenchVizGraph): AtlasDemoGraph {
  const nodes: AtlasDemoNode[] = viz.nodes.map((n) => {
    const family = provisionalKindToFamily(n.subtitle);
    return {
      id: n.id,
      label: n.label.trim() || "Entity",
      kind: family,
      lane: LANE_BY_FAMILY[family],
      essential: n.reviewStatus === "accepted",
    };
  });

  const edges: AtlasDemoEdge[] = viz.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    verb: e.label?.trim() || "relates",
    ended: e.reviewStatus === "rejected" || e.reviewStatus === "deferred",
  }));

  return {
    phases: ATLAS_SESSION_PHASES,
    nodes,
    edges,
  };
}
