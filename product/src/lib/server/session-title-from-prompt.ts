const DISPLAY_TITLE_MAX = 200;

/**
 * Deterministic short label when we skip or cannot use the LLM title suggester.
 * Uses the first line, collapses whitespace, and clamps length.
 */
export function fallbackDisplayTitleFromSeed(seedQuery: string): string {
  const line = seedQuery.trim().split(/\r?\n/)[0]?.trim() ?? "";
  const collapsed = line.replace(/\s+/g, " ").trim();
  const base = collapsed.length > 0 ? collapsed : "Untitled session";
  return base.length <= DISPLAY_TITLE_MAX ? base : `${base.slice(0, Math.max(0, DISPLAY_TITLE_MAX - 1))}…`;
}
