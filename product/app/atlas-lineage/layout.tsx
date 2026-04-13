import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lineage explorer (D3 prototype) — GrooveGraph",
  description:
    "Interactive D3 force graph prototype with research-themed demo data. Scoped styles; does not replace the workbench Sigma graph.",
};

export default function AtlasLineageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
