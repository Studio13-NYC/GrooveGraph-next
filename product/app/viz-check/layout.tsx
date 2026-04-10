import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Viz check — GrooveGraph",
  description: "Prototype comparisons for workbench graph visualization options.",
};

export default function VizCheckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
