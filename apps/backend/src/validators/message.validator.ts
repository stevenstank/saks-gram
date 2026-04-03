import { z } from "zod";

export const createMessageSchema = z
  .object({
    conversationId: z.string().uuid("conversationId must be a valid UUID"),
    type: z.enum(["TEXT", "POST"]),
    text: z.string().trim().max(2000, "Text must be at most 2000 characters").optional(),
    postId: z.string().uuid("postId must be a valid UUID").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "TEXT") {
      if (!value.text || value.text.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["text"],
          message: "TEXT messages require text",
        });
      }

      if (value.postId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["postId"],
          message: "TEXT messages must not include postId",
        });
      }
    }

    if (value.type === "POST") {
      if (!value.postId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["postId"],
          message: "POST messages require postId",
        });
      }

      if (value.text && value.text.trim() !== "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["text"],
          message: "POST messages must not include text",
        });
      }
    }
  });

export const getConversationMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "page must be at least 1").optional().default(1),
  limit: z.coerce.number().int().min(1, "limit must be at least 1").max(100, "limit must be at most 100").optional().default(20),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type GetConversationMessagesQueryInput = z.infer<typeof getConversationMessagesQuerySchema>;
