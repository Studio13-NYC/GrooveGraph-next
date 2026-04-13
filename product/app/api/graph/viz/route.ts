import { NextResponse } from "next/server";
import { getGraphPersistence } from "@/src/lib/server/graph-persistence/get-graph-persistence";
import type { WorkbenchVizApiResponse } from "@/src/types/workbench-viz-graph";

export const dynamic = "force-dynamic";

/**
 * Full workbench graph across all sessions (`graph-entity` + `graph-relationship` in TypeDB).
 * Used by `/atlas-lineage` before a research session is selected.
 */
export async function GET(request: Request) {
  const focusNodeId = new URL(request.url).searchParams.get("focusNodeId")?.trim() || undefined;

  try {
    const persistence = getGraphPersistence();
    const graph = await persistence.fetchGlobalVizGraph(focusNodeId ? { focusNodeId } : undefined);
    const body: WorkbenchVizApiResponse = { source: "typedb", graph };
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load global graph.";
    const status = message.toLowerCase().includes("not configured") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
