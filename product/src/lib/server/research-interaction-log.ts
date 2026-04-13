import type OpenAI from "openai";

/**
 * Structured stdout logs for `/api/sessions/:id/turn` so you can trace model rounds,
 * tool calls, and extraction without guessing from the UI.
 *
 * Enable explicitly in production:
 *   RESEARCH_INTERACTION_LOG=1
 * In development, logging defaults **on** unless:
 *   RESEARCH_INTERACTION_LOG=0
 */
export function isResearchInteractionLogEnabled(): boolean {
  const v = process.env.RESEARCH_INTERACTION_LOG?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") {
    return true;
  }
  if (v === "0" || v === "false" || v === "no") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}

const MAX_PREVIEW = 480;

export function truncateForLog(text: string, max = MAX_PREVIEW): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max)}…`;
}

export function summarizeResponseOutput(response: OpenAI.Responses.Response): {
  responseId: string;
  outputTypes: Record<string, number>;
  outputTextChars: number;
} {
  const outputTypes: Record<string, number> = {};
  for (const item of response.output ?? []) {
    const t = "type" in item && typeof item.type === "string" ? item.type : "unknown";
    outputTypes[t] = (outputTypes[t] ?? 0) + 1;
  }
  return {
    responseId: response.id,
    outputTypes,
    outputTextChars: (response.output_text ?? "").length,
  };
}

export function logResearchInteraction(
  sessionId: string,
  phase: string,
  data: Record<string, unknown> = {},
): void {
  if (!isResearchInteractionLogEnabled()) {
    return;
  }
  const payload = {
    ts: new Date().toISOString(),
    scope: "gg-research",
    sessionId,
    phase,
    ...data,
  };
  console.info(`[gg-research] ${JSON.stringify(payload)}`);
}
