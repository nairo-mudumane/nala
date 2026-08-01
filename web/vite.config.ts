import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Vite only ever injects `VITE_`-prefixed variables into the bundles, and it
  // never touches `process.env`. Server-side readers (Clerk's `CLERK_SECRET_KEY`
  // above all) go through `process.env`, so the root `.env` — reachable here
  // through the `web/.env → ../.env` symlink — is loaded into this process by
  // hand. Real environment variables win, which is what keeps production
  // (where there is no `.env` at all) working unchanged.
  for (const [key, value] of Object.entries(
    loadEnv(mode, import.meta.dirname, ""),
  )) {
    process.env[key] ??= value;
  }

  return {
    server: { port: 3000 },
    resolve: {
      // Vite 8 resolves the `paths` from tsconfig.json natively (`@/*`).
      tsconfigPaths: true,
    },
    plugins: [
      tailwindcss(),
      tanstackStart({
        // Routes stay in `src/app`, mirroring the layout the app had under the
        // Next App Router — `__root.tsx` + `index.tsx` instead of
        // `layout.tsx` + `page.tsx`.
        srcDirectory: "src",
        router: { routesDirectory: "app" },
      }),
      // React's plugin must come after Start's.
      viteReact(),
      // `preset: "bun"` emits a server bundle started with `bun`, not `node`.
      nitro({ preset: "bun" }),
    ],
  };
});
