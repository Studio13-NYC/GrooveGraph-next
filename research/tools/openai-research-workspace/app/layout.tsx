import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrooveGraph OpenAI Research Workspace",
  description: "Discovery-first research workspace powered by the OpenAI Responses API and Conversations API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
