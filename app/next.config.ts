import type { NextConfig } from "next";
import packageJson from "./package.json";

// Use 'export' for Capacitor builds, 'standalone' for Docker
const isStaticExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  typescript: {
    // TODO: Fix type errors and remove this
    ignoreBuildErrors: true,
  },
  env: {
    APP_VERSION: packageJson.version,
  },
  experimental: {
    instrumentationHook: !isStaticExport,
  },
  // Static export configuration for Capacitor
  ...(isStaticExport && {
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
  }),
};

export default nextConfig;
