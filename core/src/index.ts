import { TRUSTED_ORIGINS } from "@nala/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  type AuthVariables,
  authRoutes,
  requireAuth,
  sessionMiddleware,
} from "./auth.js";

const app = new Hono<{ Variables: AuthVariables }>();

// O cliente do Better Auth envia cookies cross-origin (web:3000 → core:3001),
// por isso `credentials` tem de estar ligado e a origem tem de ser explícita.
app.use(
  "*",
  cors({
    origin: TRUSTED_ORIGINS,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    credentials: true,
  }),
);

// Handler do Better Auth — tem de vir antes do middleware de sessão.
app.route("/", authRoutes);

app.use("*", sessionMiddleware);

app.get("/", (c) => c.text("Nala Core API"));

app.get("/health", (c) => c.json({ status: "ok" }));

/** Exemplo de rota protegida — devolve o utilizador da sessão atual. */
app.get("/me", requireAuth, (c) => c.json({ user: c.var.user }));

export default {
  port: 3001,
  fetch: app.fetch,
};
