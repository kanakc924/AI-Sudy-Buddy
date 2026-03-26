import { z } from "zod";

export const FlashcardOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string().describe("A clear, specific question testing one concept"),
      answer: z.string().describe("A concise but complete answer"),
    })
  ),
});

export type FlashcardOutput = z.infer<typeof FlashcardOutputSchema>;
