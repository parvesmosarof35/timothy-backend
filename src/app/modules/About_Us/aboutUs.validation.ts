import { z } from "zod";

const createAboutUsSchema = z.object({
  body: z.object({
    content: z.string({
      required_error: "Content is required",
    }).min(10, "Content must be at least 10 characters"),
  }),
});

export const aboutUsValidation = {
  createAboutUsSchema,
};
