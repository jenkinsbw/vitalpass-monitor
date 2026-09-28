import "server-only";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(1),
  CRUX_API_KEY: z.string().min(1).optional(),
  SLACK_WEBHOOK_URL: z.url().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    CRUX_API_KEY: process.env.CRUX_API_KEY || undefined,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || undefined,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment variables:\n${details}`);
  }

  return parsed.data;
}

export const env = loadEnv();
