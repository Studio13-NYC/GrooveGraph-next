import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/workbench-next",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
