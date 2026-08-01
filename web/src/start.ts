import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart } from "@tanstack/react-start";

/**
 * Global request middleware, applied to SSR renders, server functions, and
 * server routes alike.
 *
 * `clerkMiddleware()` is what makes `auth()` work: it resolves the Clerk
 * session once per request and puts it where the server-side helpers look for
 * it. Without it every `auth()` call throws.
 */
export const startInstance = createStart(() => ({
  requestMiddleware: [clerkMiddleware()],
}));
