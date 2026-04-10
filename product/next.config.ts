import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

/** Ensure `.env.local` next to this file (`product/`) is merged into `process.env` before any server code runs. */
const nextConfigDir = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(nextConfigDir);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return [
      { source: "/workbench-next", destination: "/", permanent: true },
      { source: "/classic", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
