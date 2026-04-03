import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(300, "Content must be at most 300 characters"),
  postId: z.string().min(1, "postId is required"),
});
