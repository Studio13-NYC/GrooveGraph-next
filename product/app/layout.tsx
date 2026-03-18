import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrooveGraph Next Smoke Test",
  description: "CZA control page smoke test for GrooveGraph Next.",
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
