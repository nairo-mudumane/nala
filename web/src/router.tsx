import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

/**
 * TanStack Start calls this on every request (server) and once on hydration
 * (browser), so it has to hand back a fresh router each time — a shared
 * instance would leak one visitor's loader data into the next request.
 */
export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
