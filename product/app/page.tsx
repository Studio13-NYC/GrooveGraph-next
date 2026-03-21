"use client";

import { useEffect, useState } from "react";

interface SmokePayload {
  banner: string;
  status: string;
  body: string;
}

const fallbackPayload: SmokePayload = {
  banner: "THIS APP IS NOW UNDER THE CONTROL OF THE CZA",
  status: "Service Suspended",
  body: "This is the minimum viable smoke test: one homepage, one API, one graphic, and one very clear transfer of authority.",
};

export default function HomePage() {
  const [payload, setPayload] = useState<SmokePayload>(fallbackPayload);

  useEffect(() => {
    let cancelled = false;

    async function loadMessage() {
      try {
        const base =
          typeof process.env.NEXT_PUBLIC_API_BASE_URL === "string"
            ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")
            : "";
        const url = `${base}/api/smoke`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as SmokePayload;
        if (!cancelled) {
          setPayload(data);
        }
      } catch {
        // Fallback payload keeps the smoke page readable if the API is unavailable.
      }
    }

    void loadMessage();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px",
      }}
    >
      <section
        style={{
          width: "min(1120px, 100%)",
          background: "color-mix(in srgb, var(--gg-sign-panel) 90%, transparent)",
          border: "2px solid var(--ink)",
          boxShadow: "0 20px 50px color-mix(in srgb, var(--ink) 10%, transparent)",
        }}
      >
        <div
          style={{
            borderBottom: "2px solid var(--ink)",
            padding: "28px 32px 28px",
            display: "grid",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              fontWeight: 800,
              letterSpacing: "0.02em",
              fontSize: "14px",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: "42px",
                height: "42px",
                borderRadius: "999px",
                background: "#111111",
                color: "#ffffff",
                fontSize: "20px",
              }}
            >
              CZ
            </span>
            County Zoning Authority
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(28px, 5vw, 58px)",
              lineHeight: 0.95,
              fontWeight: 800,
            }}
          >
            {payload.banner}
          </h1>

          <div
            style={{
              fontSize: "clamp(34px, 5vw, 62px)",
              fontWeight: 800,
              letterSpacing: "0.04em",
              lineHeight: 0.95,
              textAlign: "center",
              textTransform: "uppercase",
              color: "var(--red-route)",
            }}
          >
            {payload.status}
          </div>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: "14px",
              lineHeight: 1.5,
              color: "var(--slate)",
              textAlign: "left",
            }}
          >
            {payload.body}
          </p>
        </div>

        <div style={{ padding: "28px" }}>
          <img
            src="/cza-map.svg"
            alt="County Zoning Authority governance map"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              border:
                "2px solid color-mix(in srgb, var(--ink) 22%, transparent)",
            }}
          />
        </div>
      </section>
    </main>
  );
}
