import type { NextConfig } from "next";

const staticExport = process.env.GROOVEGRAPH_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: staticExport ? "export" : "standalone",
};

export default nextConfig;
