import type { ReviewStatus } from "@/src/types/research-session";

/**
 * Schema-aligned KindFamily clusters (policy: merge aura-node-* semantics for viz filters).
 * Maps provisionalKind / subtitle strings from sessions + TypeDB to one family.
 * Authority: docs/DB-Schema-Export.typeql (aura-node-person, artist, band, album, release, …).
 */
export type KindFamily =
  | "people"
  | "recordings"
  | "studios"
  | "labels"
  | "genres"
  | "gear"
  | "other";

export const KIND_FILTER_KEYS: KindFamily[] = [
  "people",
  "recordings",
  "studios",
  "labels",
  "genres",
  "gear",
  "other",
];

/**
 * Hex fills — must match --gg-viz-family-* in nycta-groovegraph-tokens.css (canvas/WebGL cannot use CSS var strings in Sigma).
 */
/** Fill hex per family — matches graph nodes and filter swatches (WebGL cannot use CSS vars). */
export const KIND_FAMILY_HEX: Record<KindFamily, string> = {
  people: "#996633",
  recordings: "#fccc0a",
  studios: "#0039a6",
  labels: "#ee352e",
  genres: "#6cbe45",
  gear: "#a7a9ac",
  other: "#5a5654",
};

/** Neutral fill for status ring preview (same role as node fill in `statusToBorderColor`). */
export const FILTER_STATUS_NEUTRAL_FILL = "#e8e6e0";

export function kindFamilyHex(key: KindFamily): string {
  return KIND_FAMILY_HEX[key];
}

let unknownKindLog = new Set<string>();

/**
 * Map provisional kind string → KindFamily. Synonyms cover common session + LLM outputs.
 */
export function provisionalKindToFamily(kind: string | undefined): KindFamily {
  const s = (kind ?? "").trim().toLowerCase();
  if (!s || s === "unresolved") {
    return "other";
  }

  if (
    s === "person" ||
    s === "people" ||
    s === "artist" ||
    s === "band" ||
    s === "musician" ||
    s.includes("person") && s.length < 24
  ) {
    return "people";
  }

  if (
    s === "recording" ||
    s === "recordings" ||
    s === "album" ||
    s === "release" ||
    s === "track" ||
    s === "performance" ||
    s === "song"
  ) {
    return "recordings";
  }

  if (s === "studio" || s === "venue" || s === "recording studio") {
    return "studios";
  }

  if (s === "label" || s === "record label" || s === "publisher") {
    return "labels";
  }

  if (s === "genre" || s === "style" || s === "concept") {
    return "genres";
  }

  if (s === "instrument" || s === "effect" || s === "technology" || s === "product" || s === "artifact") {
    return "gear";
  }

  if (s === "organization" || s === "claim" || s === "component") {
    return "other";
  }

  if (process.env.NODE_ENV === "development" && typeof kind === "string" && kind.trim()) {
    unknownKindLog.add(kind.trim());
    if (unknownKindLog.size <= 40) {
      console.debug(`[graph-viz] unmapped provisionalKind → other: "${kind}"`);
    }
  }

  return "other";
}

/** Labels that map to {@link KindFamily} `"other"` but are still treated as established session kinds. */
const KINDS_KNOWN_IN_OTHER_FAMILY = new Set(["organization", "claim", "component"]);

/**
 * True when a provisional kind string is unfamiliar: it maps to the `"other"` family
 * in {@link provisionalKindToFamily} but is not one of the small known `"other"` labels.
 * Used to show "new type" review UI only when the model proposes a genuinely new kind name.
 */
export function isNovelProvisionalKind(kind: string): boolean {
  const raw = (kind ?? "").trim();
  if (raw === "(empty)") {
    return true;
  }
  if (!raw) {
    return false;
  }
  if (provisionalKindToFamily(kind) !== "other") {
    return false;
  }
  return !KINDS_KNOWN_IN_OTHER_FAMILY.has(raw.toLowerCase());
}

function hashHue(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return `hsl(${hue} 65% 42%)`;
}

/** Fill color for entity kind (subtitle / provisional kind). */
export function kindToFillColor(kind: string | undefined): string {
  const family = provisionalKindToFamily(kind);
  if (family === "other") {
    const s = (kind ?? "").trim().toLowerCase();
    if (s && s !== "unresolved") {
      return hashHue(kind!);
    }
    return KIND_FAMILY_HEX.other;
  }
  return KIND_FAMILY_HEX[family];
}

/**
 * Status ring color (canvas stroke). `accepted` → no ring (same as fill — caller skips stroke).
 */
export function statusToBorderColor(
  status: ReviewStatus | undefined,
  fillColor: string,
): string | null {
  const s = status ?? "proposed";
  if (s === "accepted") {
    return null;
  }
  if (s === "proposed") {
    return "#111111";
  }
  if (s === "deferred") {
    return "#5a5654";
  }
  if (s === "rejected") {
    return "#ee352e";
  }
  return fillColor;
}

/**
 * Rings drawn on graph nodes (not filter swatches). Omits proposed — avoids a hollow black circle
 * on the hub / nodes that reads as a glitch; deferred and rejected stay visible.
 */
export function statusToGraphNodeRingStroke(
  status: ReviewStatus | undefined,
  fillColor: string,
): string | null {
  const s = status ?? "proposed";
  if (s === "accepted" || s === "proposed") {
    return null;
  }
  if (s === "deferred") {
    return "#5a5654";
  }
  if (s === "rejected") {
    return "#ee352e";
  }
  return fillColor;
}

export const ALL_REVIEW_STATUSES: ReviewStatus[] = ["proposed", "accepted", "deferred", "rejected"];

/** Graph filter row order (accepted first — no ring in viz; label-only row). */
export const REVIEW_STATUS_FILTER_ORDER: ReviewStatus[] = ["accepted", "proposed", "deferred", "rejected"];

export function passesKindFilters(
  subtitle: string | undefined,
  filters: Record<KindFamily, boolean>,
): boolean {
  const allOn = KIND_FILTER_KEYS.every((k) => filters[k]);
  if (allOn) {
    return true;
  }
  const noneOn = KIND_FILTER_KEYS.every((k) => !filters[k]);
  if (noneOn) {
    return false;
  }
  const family = provisionalKindToFamily(subtitle);
  return filters[family] === true;
}

export function defaultKindFilters(): Record<KindFamily, boolean> {
  return {
    people: true,
    recordings: true,
    studios: true,
    labels: true,
    genres: true,
    gear: true,
    other: true,
  };
}

const FAMILY_LABELS: Record<KindFamily, string> = {
  people: "People",
  recordings: "Recordings",
  studios: "Studios",
  labels: "Labels",
  genres: "Genres",
  gear: "Gear",
  other: "Other",
};

export function kindFamilyLabel(key: KindFamily): string {
  return FAMILY_LABELS[key];
}
