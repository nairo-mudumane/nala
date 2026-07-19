import { type AuthSession, auth } from "@nala/auth";
import { createMiddleware } from "hono/factory";
import { Hono } from "hono";

export type AuthVariables = {
  user: AuthSession["user"] | null;
  session: AuthSession["session"] | null;
};

export const authRoutes = new Hono().on(["GET", "POST"], "/api/auth/*", (c) =>
  auth.handler(c.req.raw),
);

export const sessionMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (ctx, next) => {
  const result = await auth.api.getSession({ headers: ctx.req.raw.headers });

  ctx.set("user", result?.user ?? null);
  ctx.set("session", result?.session ?? null);

  await next();
});

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (ctx, next) => {
    if (!ctx.var.user) return ctx.json({ error: "Não autenticado" }, 401);

    await next();
  },
);
