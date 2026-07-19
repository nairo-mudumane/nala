import { TRUSTED_ORIGINS } from "@nala/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type AuthVariables, sessionMiddleware } from "./auth";
import {
  authRoutes,
  DOCS_PATH,
  healthRoutes,
  meRoutes,
  mountDocs,
  OPENAPI_JSON_PATH,
  rootRoutes,
} from "./routes";

const PORT = 3001;

const app = new Hono<{ Variables: AuthVariables }>();

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

app.route("/", authRoutes);

app.use("*", sessionMiddleware);

app.route("/", rootRoutes);
app.route("/", healthRoutes);
app.route("/", meRoutes);

mountDocs(app);

console.log(`  ➜  Docs (Scalar):  http://localhost:${PORT}${DOCS_PATH}`);
console.log(
  `  ➜  OpenAPI spec:   http://localhost:${PORT}${OPENAPI_JSON_PATH}`,
);

export default {
  port: PORT,
  fetch: app.fetch,
};
