import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // TODO: Fix type errors and remove this
    ignoreBuildErrors: true,
  },
  env: {
    APP_VERSION: packageJson.version,
  },
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
