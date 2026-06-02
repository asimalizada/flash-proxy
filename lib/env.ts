import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  FLASHPROXY_API_BASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  API_KEY_ENCRYPTION_SECRET: z.string().min(32),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    throw new Error(`Invalid environment configuration: ${missing}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
