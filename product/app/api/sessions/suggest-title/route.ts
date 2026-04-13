import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/src/lib/server/openai-client";
import { suggestSessionTitleFromPrompt } from "@/src/lib/server/suggest-session-title";

export const dynamic = "force-dynamic";

type Body = { seedQuery?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const seedQuery = body.seedQuery?.trim() ?? "";
    if (!seedQuery) {
      return NextResponse.json({ error: "seedQuery is required." }, { status: 400 });
    }

    const client = getOpenAIClient();
    const suggestedTitle = await suggestSessionTitleFromPrompt(client, seedQuery);
    return NextResponse.json({ suggestedTitle });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to suggest a session title.",
      },
      { status: 500 },
    );
  }
}
