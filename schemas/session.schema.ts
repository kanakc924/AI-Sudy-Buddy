import { z } from "zod";

export const CreateSessionSchema = z.object({
  topicId: z.string().min(1, "Topic ID is required"),
  type: z.enum(["flashcard", "quiz", "summary"]),
  score: z.number().min(0).max(100).default(0),
  totalQuestions: z.number().min(0).default(0),
  correctAnswers: z.number().min(0).default(0),
  duration: z.number().min(0).default(0), // duration in seconds
  answers: z.array(z.any()).optional().default([]), // Detailed answer tracking
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
