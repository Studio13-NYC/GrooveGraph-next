import type { ReviewStatus } from "@/src/types/research-session";

/** Rich demo graph for viz-check only (not API shape). */
export type VizDemoNode = {
  id: string;
  label: string;
  kind: string;
  status: ReviewStatus;
};

export type VizDemoEdge = {
  id: string;
  source: string;
  target: string;
  verb: string;
  status: ReviewStatus;
};

export type VizDemoGraph = {
  nodes: VizDemoNode[];
  edges: VizDemoEdge[];
};

/** Shared mock: research-style triplets with varied kinds and statuses. */
export const SAMPLE_GRAPH: VizDemoGraph = {
  nodes: [
    { id: "e1", label: "Studio13", kind: "Organization", status: "accepted" },
    { id: "e2", label: "TypeDB", kind: "Technology", status: "accepted" },
    { id: "e3", label: "GrooveGraph", kind: "Product", status: "proposed" },
    { id: "e4", label: "Research session", kind: "Artifact", status: "proposed" },
    { id: "e5", label: "Claim A", kind: "Claim", status: "deferred" },
    { id: "e6", label: "Legacy UI", kind: "Component", status: "rejected" },
  ],
  edges: [
    { id: "r1", source: "e1", target: "e3", verb: "builds", status: "accepted" },
    { id: "r2", source: "e3", target: "e2", verb: "persists to", status: "accepted" },
    { id: "r3", source: "e4", target: "e3", verb: "reviews", status: "proposed" },
    { id: "r4", source: "e4", target: "e5", verb: "contains", status: "deferred" },
    { id: "r5", source: "e6", target: "e3", verb: "replaced by", status: "rejected" },
  ],
};
