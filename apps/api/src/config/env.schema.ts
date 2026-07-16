import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_VERSION: z.coerce.number().default(1),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  OPENSEARCH_URL: z.string().url().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().transform((s) => s.split(',').map((o) => o.trim())),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET_QUARANTINE: z.string().default('pazaryeri-quarantine'),
  S3_BUCKET_PUBLIC: z.string().default('pazaryeri-public'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  PAYMENTS_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  CSRF_SECRET: z.string().min(32),
  OTEL_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  OTEL_SERVICE_NAME: z.string().default('turkiye-pazaryeri-api'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
  }
  return result.data;
}
