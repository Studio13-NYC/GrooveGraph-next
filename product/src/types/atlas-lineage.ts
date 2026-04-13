/** DTOs for the /atlas-lineage D3 view (demo + TypeDB-backed session graph). */

import type { KindFamily } from "@/src/lib/workbench-viz/graph-viz-styles";

export type AtlasNodeKind =
  | "Session"
  | "Claim"
  | "Source"
  | "Organization"
  | "Artifact"
  | "Technology";

/** Demo kinds or schema-aligned KindFamily from TypeDB/session viz. */
export type AtlasSchemaKind = AtlasNodeKind | KindFamily;

export type AtlasDemoNode = {
  id: string;
  label: string;
  kind: AtlasSchemaKind;
  /** Lane index for vertical banding (0 = top). */
  lane: number;
  /** Highlight in “essential” curated view */
  essential?: boolean;
};

export type AtlasDemoEdge = {
  id: string;
  source: string;
  target: string;
  verb: string;
  /** dashed styling when terminal */
  ended?: boolean;
};

export type AtlasPhase = {
  id: string;
  name: string;
  startYear: number;
  endYear: number | null;
  order: number;
};

export type AtlasDemoGraph = {
  phases: AtlasPhase[];
  nodes: AtlasDemoNode[];
  edges: AtlasDemoEdge[];
};
