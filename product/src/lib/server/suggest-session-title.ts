import type OpenAI from "openai";
import { getSessionTitleSuggestModel } from "./config";
import { fallbackDisplayTitleFromSeed } from "./session-title-from-prompt";

const SEED_PREVIEW_MAX = 4000;

/**
 * Produces a short, human-readable session title from the user's seed / first prompt.
 * Falls back to {@link fallbackDisplayTitleFromSeed} on empty model output or errors.
 */
export async function suggestSessionTitleFromPrompt(
  client: OpenAI,
  seedQuery: string,
): Promise<string> {
  const trimmed = seedQuery.trim();
  if (!trimmed) {
    return fallbackDisplayTitleFromSeed(seedQuery);
  }

  const model = getSessionTitleSuggestModel();
  try {
    const response = await client.responses.create({
      model,
      instructions: [
        "You label research workspace sessions.",
        "Given the user's first message or seed text, reply with exactly one short title:",
        "3–8 words, Title Case, no surrounding quotes, no trailing punctuation, no emojis.",
        "If the text is mostly a URL, infer the likely subject. If it is vague, use a concise literal summary.",
      ].join(" "),
      input: [{ role: "user", content: trimmed.slice(0, SEED_PREVIEW_MAX) }],
      max_output_tokens: 80,
    });

    const raw = (response.output_text ?? "").trim();
    const firstLine = raw.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim() ?? "";
    const stripped = firstLine.replace(/^["'“”]+|["'“”]+$/g, "").trim();
    if (!stripped) {
      return fallbackDisplayTitleFromSeed(trimmed);
    }
    return stripped.length <= 200 ? stripped : `${stripped.slice(0, 199)}…`;
  } catch {
    return fallbackDisplayTitleFromSeed(trimmed);
  }
}
