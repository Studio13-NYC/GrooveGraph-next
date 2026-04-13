import {
  KIND_FAMILY_HEX,
  KIND_FILTER_KEYS,
  type KindFamily,
} from "@/src/lib/workbench-viz/graph-viz-styles";
import type { AtlasDemoGraph, AtlasNodeKind, AtlasSchemaKind } from "@/src/types/atlas-lineage";

export type AtlasViewMode = "full" | "essential";

export type AtlasDataMode = "demo" | "session" | "typedb_global";

export const ATLAS_DEMO_KIND_OPTIONS: { value: "" | AtlasNodeKind; label: string }[] = [
  { value: "", label: "All types" },
  { value: "Session", label: "Session" },
  { value: "Claim", label: "Claim" },
  { value: "Source", label: "Source" },
  { value: "Organization", label: "Organization" },
  { value: "Artifact", label: "Artifact" },
  { value: "Technology", label: "Technology" },
];

export const ATLAS_SESSION_KIND_OPTIONS: { value: "" | KindFamily; label: string }[] = [
  { value: "", label: "All types" },
  ...KIND_FILTER_KEYS.map((k) => ({
    value: k,
    label: k.charAt(0).toUpperCase() + k.slice(1),
  })),
];

/** Selectable demo kinds (excludes the aggregate “All types” row). */
export const ATLAS_DEMO_SELECTABLE_KINDS: readonly AtlasNodeKind[] = ATLAS_DEMO_KIND_OPTIONS.filter(
  (o): o is { value: AtlasNodeKind; label: string } => o.value !== "",
).map((o) => o.value);

export type AtlasFilterState = {
  viewMode: AtlasViewMode;
  /** Empty = show all entity types. Otherwise node must match one of these kinds. */
  kinds: readonly AtlasSchemaKind[];
  search: string;
  showOrganizations: boolean;
  showSources: boolean;
  dataMode: AtlasDataMode;
};

/** Full demo graph: research lineage (sessions → claims → sources). */
export const ATLAS_LINEAGE_FULL: AtlasDemoGraph = {
  phases: [
    { id: "ph1", name: "Discovery", startYear: 2024, endYear: 2024, order: 0 },
    { id: "ph2", name: "Synthesis", startYear: 2025, endYear: 2025, order: 1 },
    { id: "ph3", name: "Publication", startYear: 2026, endYear: null, order: 2 },
  ],
  nodes: [
    { id: "n1", label: "Session α", kind: "Session", lane: 0, essential: true },
    { id: "n2", label: "Session β", kind: "Session", lane: 0 },
    { id: "n3", label: "Studio13", kind: "Organization", lane: 0, essential: true },
    { id: "n4", label: "Claim: lineage UX", kind: "Claim", lane: 1, essential: true },
    { id: "n5", label: "Claim: D3 vs WebGL", kind: "Claim", lane: 1 },
    { id: "n6", label: "Paper draft", kind: "Artifact", lane: 1 },
    { id: "n7", label: "TypeDB docs", kind: "Source", lane: 1 },
    { id: "n8", label: "GrooveGraph app", kind: "Artifact", lane: 2, essential: true },
    { id: "n9", label: "Next.js", kind: "Technology", lane: 2 },
    { id: "n10", label: "D3", kind: "Technology", lane: 2 },
    { id: "n11", label: "arXiv preprint", kind: "Source", lane: 2 },
    { id: "n12", label: "Review board", kind: "Organization", lane: 2 },
  ],
  edges: [
    { id: "e1", source: "n1", target: "n4", verb: "produces" },
    { id: "e2", source: "n2", target: "n5", verb: "produces" },
    { id: "e3", source: "n3", target: "n1", verb: "hosts" },
    { id: "e4", source: "n3", target: "n2", verb: "hosts" },
    { id: "e5", source: "n4", target: "n6", verb: "documented in", ended: true },
    { id: "e6", source: "n5", target: "n7", verb: "cites" },
    { id: "e7", source: "n4", target: "n8", verb: "drives" },
    { id: "e8", source: "n9", target: "n8", verb: "powers" },
    { id: "e9", source: "n10", target: "n8", verb: "renders" },
    { id: "e10", source: "n8", target: "n11", verb: "published as", ended: true },
    { id: "e11", source: "n12", target: "n11", verb: "reviews" },
  ],
};

const KIND_COLORS: Record<AtlasNodeKind, string> = {
  Session: "#6366f1",
  Claim: "#eab308",
  Source: "#22c55e",
  Organization: "#e8943c",
  Artifact: "#3b82f6",
  Technology: "#a78bfa",
};

function isKindFamily(s: string): s is KindFamily {
  return (KIND_FILTER_KEYS as readonly string[]).includes(s);
}

export function atlasKindColor(kind: AtlasSchemaKind): string {
  if (isKindFamily(kind)) {
    return KIND_FAMILY_HEX[kind];
  }
  return KIND_COLORS[kind as AtlasNodeKind] ?? "#6b7280";
}

/** Chip visibility for TypeDB/session graphs (KindFamily on nodes). */
function passesSessionChips(
  kind: AtlasSchemaKind,
  showOrganizations: boolean,
  showSources: boolean,
): boolean {
  if (!showOrganizations && !showSources) {
    return true;
  }
  if (!isKindFamily(kind)) {
    return true;
  }
  const orgFamilies: KindFamily[] = ["people", "labels", "studios"];
  const srcFamilies: KindFamily[] = ["recordings", "genres", "gear"];
  if (kind === "other") {
    return showOrganizations || showSources;
  }
  if (orgFamilies.includes(kind)) {
    return showOrganizations;
  }
  if (srcFamilies.includes(kind)) {
    return showSources;
  }
  return true;
}

/** Nodes and edges for “essential” curated subset. */
export function atlasEssentialSubgraph(full: AtlasDemoGraph): AtlasDemoGraph {
  const ids = new Set(full.nodes.filter((n) => n.essential).map((n) => n.id));
  if (ids.size === 0) {
    return full;
  }
  const nodes = full.nodes.filter((n) => ids.has(n.id));
  const edges = full.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  return { ...full, nodes, edges };
}

/**
 * One-hop subgraph around `focusNodeId` (same topology as workbench neighborhood).
 * Returns null if the node is missing.
 */
export function extractAtlasLineageNeighborhood(
  graph: AtlasDemoGraph,
  focusNodeId: string,
): AtlasDemoGraph | null {
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  if (!nodeById.has(focusNodeId)) {
    return null;
  }
  const neighborIds = new Set<string>([focusNodeId]);
  for (const e of graph.edges) {
    if (e.source === focusNodeId || e.target === focusNodeId) {
      neighborIds.add(e.source);
      neighborIds.add(e.target);
    }
  }
  const nodes = graph.nodes.filter((n) => neighborIds.has(n.id));
  const edges = graph.edges.filter(
    (e) =>
      neighborIds.has(e.source) &&
      neighborIds.has(e.target) &&
      (e.source === focusNodeId || e.target === focusNodeId),
  );
  return { ...graph, nodes, edges };
}

export function applyAtlasFilters(base: AtlasDemoGraph, opts: AtlasFilterState): AtlasDemoGraph {
  const g = opts.viewMode === "essential" ? atlasEssentialSubgraph(base) : base;
  const q = opts.search.trim().toLowerCase();
  const nodes = g.nodes.filter((n) => {
    if (opts.dataMode === "demo") {
      if (!opts.showOrganizations && n.kind === "Organization") return false;
      if (!opts.showSources && n.kind === "Source") return false;
    } else {
      if (!passesSessionChips(n.kind, opts.showOrganizations, opts.showSources)) return false;
    }
    if (opts.kinds.length > 0 && !opts.kinds.includes(n.kind)) return false;
    if (q && !n.label.toLowerCase().includes(q)) return false;
    return true;
  });
  const ids = new Set(nodes.map((n) => n.id));
  const edges = g.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  return { ...g, nodes, edges };
}
