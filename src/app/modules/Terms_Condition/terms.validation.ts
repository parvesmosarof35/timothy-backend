import { z } from "zod";

const termsConditionSchema = z.object({
  body: z.object({
    content: z.string({
      required_error: "Content is required",
    }).min(10, "Content must be at least 10 characters"),
  }),
});

export const termsConditionValidation = {
  termsConditionSchema,
};