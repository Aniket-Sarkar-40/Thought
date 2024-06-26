import * as z from "zod";

export const ThoughtValidation = z.object({
  thought: z
    .string()
    .min(3, { message: "Minimum 3 characters" })
    .max(2000, { message: "Maximum 2000 characters" }),
  accountId: z.string(),
});

export const CommentValidation = z.object({
  thought: z
    .string()
    .min(3, { message: "Minimum 3 characters" })
    .max(2000, { message: "Maximum 2000 characters" }),
});
