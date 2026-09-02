import { z } from "zod";

export const codingExecutionRequestSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sourceCode: z.string().max(50 * 1024, "源代码不能超过 50 KB"),
  })
  .strict();

export type CodingExecutionRequest = z.infer<typeof codingExecutionRequestSchema>;
