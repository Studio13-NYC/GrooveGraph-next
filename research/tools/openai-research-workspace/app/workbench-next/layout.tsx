import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./workbench-next.css";

export const metadata: Metadata = {
  title: "GrooveGraph — Research workbench (Next regime)",
  description:
    "NYCTA / Vignelli-aligned workbench shell: sign-plate grammar, explicit interchanges, token-bound rails. Same research engine as the classic workspace.",
};

export default function WorkbenchNextLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
