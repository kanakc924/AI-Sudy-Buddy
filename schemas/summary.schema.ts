import { z } from "zod";

// The PRD doesn't strictly define a distinct summary structured schema since `generateText` is used,
// but if we were to use `generateObject` for sections:
export const SummaryOutputSchema = z.object({
  summary: z.string().describe("A clear, structured format with key concepts highlighted"),
});

export type SummaryOutput = z.infer<typeof SummaryOutputSchema>;
