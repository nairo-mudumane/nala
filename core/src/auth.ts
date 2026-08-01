import { type AuthState, authenticateRequest } from "@nala/auth";
import { createMiddleware } from "hono/factory";

export type AuthVariables = {
  /** Clerk user id, or null on an anonymous request. */
  userId: AuthState["userId"] | null;
  /** Clerk session id, or null on an anonymous request. */
  sessionId: AuthState["sessionId"] | null;
};

/**
 * Resolves the Clerk session token carried by the request and drops the result
 * in the context. Never rejects — whether anonymous is acceptable is the
 * route's call, not the middleware's.
 */
export const sessionMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (ctx, next) => {
  const auth = await authenticateRequest(ctx.req.raw);

  ctx.set("userId", auth?.userId ?? null);
  ctx.set("sessionId", auth?.sessionId ?? null);

  await next();
});

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (ctx, next) => {
    if (!ctx.var.userId) return ctx.json({ error: "Not authenticated" }, 401);

    await next();
  },
);
