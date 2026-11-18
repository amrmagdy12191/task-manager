import { PrismaClient } from '@prisma/client'
import { env } from './env'

if (env.DATA_SOURCE !== 'postgres') {
  throw new Error('PostgreSQL access is disabled in demo mode. Use the configured data source.')
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Unscoped client is reserved for Auth.js, health checks, migrations and explicit seed scripts.
// Application reads use withAccessControl; feature writes must add resource authorization.
export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
  // Prisma error logs can embed query arguments. Actions report sanitized failures instead.
  log: [],
})

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db
