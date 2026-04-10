import type { ReviewStatus } from "@/src/types/research-session";

/** Hex values aligned to `nycta-groovegraph-tokens.css` route family (Sigma needs resolved colors). */
export const ROUTE_HEX: Record<string, string> = {
  Organization: "#ee352e",
  Technology: "#0039a6",
  Product: "#00933c",
  Artifact: "#ff6319",
  Claim: "#b933ad",
  Component: "#a7a9ac",
  default: "#5a5654",
};

export function kindToColor(kind: string): string {
  return ROUTE_HEX[kind] ?? ROUTE_HEX.default;
}

/**
 * Status → node fill (WebGL-friendly). Rings need custom program; we approximate with fill + size.
 */
export function statusToNodeStyle(status: ReviewStatus): { color: string; size: number } {
  switch (status) {
    case "accepted":
      return { color: "#00933c", size: 12 };
    case "proposed":
      return { color: "#111111", size: 11 };
    case "deferred":
      return { color: "#8a8583", size: 10 };
    case "rejected":
      return { color: "#c4c2c0", size: 9 };
    default:
      return { color: "#111111", size: 10 };
  }
}

export const STATUS_LEGEND: { status: ReviewStatus; label: string }[] = [
  { status: "accepted", label: "Accepted" },
  { status: "proposed", label: "Proposed" },
  { status: "deferred", label: "Deferred" },
  { status: "rejected", label: "Rejected" },
];

export const KIND_LEGEND: { kind: string }[] = [
  { kind: "Organization" },
  { kind: "Technology" },
  { kind: "Product" },
  { kind: "Artifact" },
  { kind: "Claim" },
  { kind: "Component" },
];
