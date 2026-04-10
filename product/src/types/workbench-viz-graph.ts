import type { ReviewStatus } from "@/src/types/research-session";

/**
 * Neutral DTO for Sigma / Graphology: stable string ids, optional labels.
 * Server may use TypeDB entity IIDs; client fallback uses entity candidate ids.
 */
export type WorkbenchVizNode = {
  id: string;
  label: string;
  subtitle?: string;
  /** Entity review status when known (session or TypeDB). */
  reviewStatus?: ReviewStatus;
};

export type WorkbenchVizEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  /** Relationship review status when known. */
  reviewStatus?: ReviewStatus;
};

export type WorkbenchVizGraph = {
  nodes: WorkbenchVizNode[];
  edges: WorkbenchVizEdge[];
};

export type WorkbenchVizApiResponse = {
  source: "typedb" | "session";
  graph: WorkbenchVizGraph;
};

/** Compact status line for the workbench footer (driven by WorkbenchSigmaGraph). */
export type WorkbenchGraphFooterSlice = {
  phase: "loading" | "empty" | "empty-filter" | "ready";
  dataSource: "typedb" | "session" | null;
  nodeCount: number;
  edgeCount: number;
  filterNote: string | null;
  selectedNode: {
    label: string;
    subtitle?: string;
    reviewStatus?: ReviewStatus;
    id: string;
  } | null;
  focusedNodeId: string | null;
};
