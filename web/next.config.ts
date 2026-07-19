import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// O monorepo tem um único `.env` na raiz — carregá-lo antes de tudo o resto
// para que `@nala/db` e `@nala/auth` vejam DATABASE_URL / BETTER_AUTH_SECRET.
loadEnvConfig(path.resolve(process.cwd(), ".."));

const nextConfig: NextConfig = {
  transpilePackages: ["@nala/ui", "@nala/auth", "@nala/db"],
};

export default nextConfig;
