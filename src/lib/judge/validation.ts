import { z } from "zod";

export const codingExecutionRequestSchema = z
  .object({
    slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sourceCode: z.string().max(50 * 1024, "Source code must be 50 KB or smaller"),
  })
  .strict();

export type CodingExecutionRequest = z.infer<typeof codingExecutionRequestSchema>;
