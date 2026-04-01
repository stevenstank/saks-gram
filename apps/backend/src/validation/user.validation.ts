import { z } from "zod";

export const updateUserSchema = z
  .object({
    bio: z.string().trim().max(280, "Bio must be at most 280 characters").nullable().optional(),
    avatar: z.string().trim().url("Avatar must be a valid URL").nullable().optional(),
  })
  .strict()
  .refine((data) => data.bio !== undefined || data.avatar !== undefined, {
    message: "At least one of bio or avatar must be provided",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
