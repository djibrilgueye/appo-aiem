import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  devIndicators: false,
  // Production reference snapshots are local review material, never deployment assets.
  outputFileTracingExcludes: { "*": ["./backups/**/*"] },
};

export default nextConfig;
