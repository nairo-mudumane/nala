import { z } from "zod";

export const ErrorSchema = z
  .object({ error: z.string().meta({ example: "Não autenticado" }) })
  .meta({ id: "Error" });
