import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // TODO: Fix type errors and remove this
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
