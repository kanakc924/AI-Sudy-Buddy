import { z } from "zod";

export const QuizOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe("A clear question testing understanding"),
      options: z
        .array(z.string())
        .length(4)
        .describe("Exactly 4 answer choices"),
      correctIndex: z
        .number()
        .min(0)
        .max(3)
        .describe("Index of the correct answer (0-3)"),
      explanation: z
        .string()
        .describe("Why the correct answer is right"),
    })
  ).min(1).max(20),
});

export type QuizOutput = z.infer<typeof QuizOutputSchema>;
