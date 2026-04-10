import type { Metadata } from "next";
import { GrooveGraphApp } from "@/src/groove-graph-app/GrooveGraphApp";

export const metadata: Metadata = {
  title: "GrooveGraph — Research app",
  description:
    "NYCTA-aligned research app: modular plates, session index, column split, and token-bound surfaces. Discovery-first research powered by the OpenAI APIs.",
};

export default function MainPage() {
  return <GrooveGraphApp />;
}
