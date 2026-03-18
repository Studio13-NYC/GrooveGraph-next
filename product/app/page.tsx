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
        const response = await fetch("/api/smoke", { cache: "no-store" });
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
          background: "rgba(255,255,255,0.42)",
          border: "2px solid #111111",
          boxShadow: "0 20px 50px rgba(17,17,17,0.08)",
        }}
      >
        <div
          style={{
            borderBottom: "2px solid #111111",
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
                color: "#F2E9D8",
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
              color: "#D7332F",
            }}
          >
            {payload.status}
          </div>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: "14px",
              lineHeight: 1.5,
              color: "#475569",
              textAlign: "left",
            }}
          >
            {payload.body}
          </p>
        </div>

        <div style={{ padding: "28px" }}>
          <img
            src="/cza-map.png"
            alt="County Zoning Authority governance map"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              border: "2px solid rgba(17,17,17,0.18)",
            }}
          />
        </div>
      </section>
    </main>
  );
}
