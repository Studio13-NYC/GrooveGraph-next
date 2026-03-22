import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./workbench.css";

export const metadata: Metadata = {
  title: "GrooveGraph — Research workbench",
  description:
    "NYCTA manual-first workbench: modular plates, session index, column split, token-bound surfaces. Discovery-first research powered by the OpenAI APIs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://mcp.figma.com/mcp/html-to-design/capture.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
