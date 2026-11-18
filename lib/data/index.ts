import { env } from '@/lib/env'
import { requireUserId } from '@/lib/access-control'

// Load only the selected backend. Demo mode never constructs a Prisma client.
async function source() {
  return env.DATA_SOURCE === 'demo' ? import('./demo') : import('./postgres')
}

export async function findCredentialsUser(email: string) {
  return (await source()).findCredentialsUser(email)
}

export async function getUserProfile(userId: string) {
  requireUserId(userId)
  return (await source()).getUserProfile(userId)
}

export async function checkDataConnection() {
  await (await source()).checkDataConnection()
}
