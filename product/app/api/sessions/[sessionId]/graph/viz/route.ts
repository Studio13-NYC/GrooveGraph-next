import { NextResponse } from "next/server";
import { getGraphPersistence } from "@/src/lib/server/graph-persistence/get-graph-persistence";
import { readSession } from "@/src/lib/server/session-store";
import { buildVizGraphFromSession } from "@/src/lib/workbench-viz/build-from-session";
import { extractWorkbenchVizNeighborhood } from "@/src/lib/workbench-viz/viz-neighborhood";
import type { WorkbenchVizApiResponse } from "@/src/types/workbench-viz-graph";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const focusNodeId = new URL(request.url).searchParams.get("focusNodeId")?.trim() || undefined;

  try {
    const session = await readSession(sessionId);
    const persistence = getGraphPersistence();
    const sessionGraph = buildVizGraphFromSession(session);

    let source: WorkbenchVizApiResponse["source"] = "session";
    let graph = sessionGraph;
    if (focusNodeId) {
      const sub = extractWorkbenchVizNeighborhood(sessionGraph, focusNodeId);
      graph = sub ?? sessionGraph;
    }

    try {
      const typedbGraph = await persistence.fetchSessionVizGraph(
        sessionId,
        focusNodeId ? { focusNodeId } : undefined,
      );
      if (typedbGraph.nodes.length > 0 || typedbGraph.edges.length > 0) {
        graph = typedbGraph;
        source = "typedb";
      }
    } catch {
      /* TypeDB unavailable or misconfigured: session-derived graph remains */
    }

    const body: WorkbenchVizApiResponse = { source, graph };
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session not found.";
    const isNotFound = message.includes("ENOENT") || message.includes("not found");
    return NextResponse.json({ error: message }, { status: isNotFound ? 404 : 500 });
  }
}
