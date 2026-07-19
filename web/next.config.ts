import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nala/ui", "@nala/auth"],
};

export default nextConfig;
