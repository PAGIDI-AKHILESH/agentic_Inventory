import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url().optional(), // Optional because we use sqlite for now
  JWT_SECRET: z.string().default('super-secret-key-for-dev-only-change-in-prod'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  // Add other environment variables here (e.g., LLM keys, third-party API keys)
});

export const env = envSchema.parse(process.env);

// This ensures type safety when accessing process.env
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
