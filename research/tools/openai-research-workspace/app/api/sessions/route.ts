import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/src/lib/server/openai-client";
import { createSession, listSessions } from "@/src/lib/server/session-store";
import type { CreateSessionRequest } from "@/src/types/research-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = await listSessions();
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSessionRequest;
    if (!body.seedQuery?.trim()) {
      return NextResponse.json({ error: "seedQuery is required." }, { status: 400 });
    }

    const client = getOpenAIClient();
    const conversation = await client.conversations.create({
      metadata: {
        groovegraph_surface: "research_workspace",
        groovegraph_seed: body.seedQuery.slice(0, 64),
      },
    });

    const session = await createSession(body.seedQuery, conversation.id);
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create a new research session.",
      },
      { status: 500 },
    );
  }
}
