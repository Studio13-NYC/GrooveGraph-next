import type { WorkbenchVizGraph } from "@/src/types/workbench-viz-graph";

/**
 * One-hop subgraph: focus node, every neighbor linked by an edge, and only edges incident to the focus.
 * Returns null if `focusNodeId` is not present in `graph.nodes`.
 */
export function extractWorkbenchVizNeighborhood(
  graph: WorkbenchVizGraph,
  focusNodeId: string,
): WorkbenchVizGraph | null {
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
  return { nodes, edges };
}
