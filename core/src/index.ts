import { TRUSTED_ORIGINS } from "@nala/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type AuthVariables, sessionMiddleware } from "./auth";
import {
  DOCS_PATH,
  healthRoutes,
  meRoutes,
  mountDocs,
  OPENAPI_JSON_PATH,
  rootRoutes,
  webhookRoutes,
} from "./routes";

const PORT = Number(process.env.PORT ?? 3001);

const app = new Hono<{ Variables: AuthVariables }>();

app.use(
  "*",
  cors({
    origin: TRUSTED_ORIGINS,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    credentials: true,
  }),
);

app.route("/", webhookRoutes);
app.route("/", healthRoutes);

app.use("*", sessionMiddleware);

app.route("/", rootRoutes);
app.route("/", meRoutes);

// Last: `generateSpecs` walks the routes already registered on the app.
mountDocs(app);

console.log(`Docs (Scalar):  http://localhost:${PORT}${DOCS_PATH}`);
console.log(`OpenAPI spec:   http://localhost:${PORT}${OPENAPI_JSON_PATH}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
