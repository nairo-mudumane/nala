import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

export const rootRoutes = new Hono().get(
  "/",
  describeRoute({
    tags: ["Sistema"],
    summary: "Raiz da API",
    responses: {
      200: {
        description: "Nome do serviço.",
        content: { "text/plain": { schema: { type: "string" } } },
      },
    },
  }),
  (c) => c.text("Nala Core API"),
);
