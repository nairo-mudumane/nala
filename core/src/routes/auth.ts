import { auth } from "@nala/auth";
import { Hono } from "hono";

export const authRoutes = new Hono().on(["GET", "POST"], "/api/auth/*", (c) =>
  auth.handler(c.req.raw),
);
