import { z } from "zod";

export const loginRequestSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(16, "Enter a valid FlashProxy API key")
    .regex(/^fp_(live|test)_[A-Za-z0-9_-]+$/, "Enter a valid FlashProxy API key"),
});

export type LoginRequestInput = z.infer<typeof loginRequestSchema>;
