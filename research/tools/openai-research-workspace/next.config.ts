import type { NextConfig } from "next";

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
