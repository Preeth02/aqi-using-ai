import { z } from "zod";

export const signInSchema = z.object({
  // Identifier can be any thing like email or username. So we are taking a common name as identifier
  identifier: z.string(),
  password: z.string(),
});
