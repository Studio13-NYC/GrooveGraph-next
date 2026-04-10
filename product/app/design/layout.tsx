import type { Metadata } from "next";
import "./styleguide.css";

export const metadata: Metadata = {
  title: "GrooveGraph — Design system",
  description:
    "In-app styleguide for GrooveGraph Next: NYCTA-aligned tokens, typography, strokes, map grammar, plates, and research workbench widgets.",
};

export default function DesignLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="gg-sg-shell" style={{ minBlockSize: "100%" }}>
      {children}
    </div>
  );
}
