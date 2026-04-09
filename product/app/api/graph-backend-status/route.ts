import { NextResponse } from "next/server";
import { getGraphBackendStatus } from "@/src/lib/server/graph-backend-status";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getGraphBackendStatus();
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Graph backend status failed.";
    return NextResponse.json(
      {
        configured: false,
        reachable: false,
        database: null,
        message,
      },
      { status: 500 },
    );
  }
}
