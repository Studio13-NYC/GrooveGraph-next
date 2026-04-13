import type { AtlasDemoGraph } from "@/src/types/atlas-lineage";
import type { WorkbenchVizGraph } from "@/src/types/workbench-viz-graph";

/**
 * Drops nodes that participate in no edges. Keeps only edges whose endpoints remain.
 * Used so the UI does not imply relationships that are not stored in the graph model.
 */
export function pruneWorkbenchVizIsolatedNodes(graph: WorkbenchVizGraph): WorkbenchVizGraph {
  const incident = new Set<string>();
  for (const e of graph.edges) {
    incident.add(e.source);
    incident.add(e.target);
  }
  const nodes = graph.nodes.filter((n) => incident.has(n.id));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  return { nodes, edges };
}

/** Same as {@link pruneWorkbenchVizIsolatedNodes} for atlas-lineage D3 graphs. */
export function pruneAtlasDemoIsolatedNodes(graph: AtlasDemoGraph): AtlasDemoGraph {
  const incident = new Set<string>();
  for (const e of graph.edges) {
    incident.add(e.source);
    incident.add(e.target);
  }
  const nodes = graph.nodes.filter((n) => incident.has(n.id));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  return { phases: graph.phases, nodes, edges };
}
