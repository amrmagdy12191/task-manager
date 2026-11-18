import { z } from 'zod'

const postgresUrl = z.string().min(1, 'DATABASE_URL is required').refine((value) => {
  try { return ['postgresql:', 'postgres:'].includes(new URL(value).protocol) } catch { return false }
}, 'DATABASE_URL must be a PostgreSQL connection URL')

const common = {
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().refine((value) => {
    try { return ['http:', 'https:'].includes(new URL(value).protocol) } catch { return false }
  }, 'NEXTAUTH_URL must be a valid HTTP(S) URL'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
}

const envSchema = z.discriminatedUnion('DATA_SOURCE', [
  z.object({ DATABASE_URL: postgresUrl, DATA_SOURCE: z.literal('postgres'), ...common }),
  z.object({ DATABASE_URL: z.string().optional(), DATA_SOURCE: z.literal('demo'), ...common }),
])

export function parseEnv(input: Record<string, string | undefined>) {
  const parsed = envSchema.safeParse({ ...input, DATA_SOURCE: input.DATA_SOURCE ?? 'postgres' })
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
    throw new Error(`Missing or invalid environment variables:\n${errors.join('\n')}\nCopy .env.local.example to .env.local and fill in all values.`)
  }
  return parsed.data
}
