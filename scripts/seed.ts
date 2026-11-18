import nextEnv from '@next/env'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { z } from 'zod'

nextEnv.loadEnvConfig(process.cwd())

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Local seed is disabled in production')
  if (process.env.DATA_SOURCE === 'demo') {
    const { readDemoData } = await import('../lib/data/demo')
    const data = await readDemoData()
    console.log(`Demo data is ready: ${data.users.length} users, ${data.projects.length} projects, ${data.tasks.length} tasks. Source: data/demo-data.json`)
    return
  }
  const input = z.object({
    SEED_EMAIL: z.string().trim().toLowerCase().email(),
    SEED_PASSWORD: z.string().min(12).max(72),
    SEED_NAME: z.string().trim().min(1).max(100).default('Local Developer'),
    DATABASE_URL: z.string().min(1),
  }).parse(process.env)
  const db = new PrismaClient({ datasources: { db: { url: input.DATABASE_URL } } })
  try {
    const passwordHash = await hash(input.SEED_PASSWORD, 12)
    const profile = {
      displayName: input.SEED_NAME,
      avatarInitials: input.SEED_NAME.split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '').join(''),
      passwordHash,
    }
    await db.user.upsert({
      where: { email: input.SEED_EMAIL },
      create: { email: input.SEED_EMAIL, name: input.SEED_NAME, profile: { create: profile } },
      update: { name: input.SEED_NAME, profile: { upsert: { create: profile, update: profile } } },
    })
    console.log('Local development user is ready. Use the credentials in your .env.local file.')
  } finally { await db.$disconnect() }
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1 })
