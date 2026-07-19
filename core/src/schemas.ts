import { z } from "zod";

export const ErrorSchema = z
  .object({ error: z.string().meta({ example: "Not authenticated" }) })
  .meta({ id: "Error" });
