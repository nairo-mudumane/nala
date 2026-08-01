import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

/**
 * Whether the current request carries a valid Clerk session.
 *
 * This is the cheap check — it never leaves the process. Routes that need the
 * user themselves go through `requireUser` in `@/lib/core`, which reads the
 * mirrored row from `core`.
 *
 * The handler body never reaches the browser: during SSR it runs in-process,
 * and on a client navigation it becomes an RPC back to this server. Either way
 * the check happens where `CLERK_SECRET_KEY` lives — and a `beforeLoad` guard
 * is UX, not a security boundary; `core` verifies the token itself.
 */
export const getAuthState = createServerFn({ method: "GET" }).handler(
  async () => {
    const { isAuthenticated, userId } = await auth();
    return { isAuthenticated, userId };
  },
);
