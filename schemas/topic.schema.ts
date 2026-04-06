import { z } from "zod";

export const CreateTopicSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  notes: z.string().max(50000, "Notes are too long").optional(),
});

export const UpdateTopicSchema = CreateTopicSchema.partial();

export type CreateTopicInput = z.infer<typeof CreateTopicSchema>;
export type UpdateTopicInput = z.infer<typeof UpdateTopicSchema>;
