import { env } from '@/lib/env'
import { requireUserId } from '@/lib/access-control'
import type { NewAccount, ProfileInput } from './types'

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

export async function getPublicProfile(userId: string) {
  requireUserId(userId)
  return (await source()).getPublicProfile(userId)
}

export async function createAccount(input: NewAccount) { return (await source()).createAccount(input) }

export async function updateProfile(userId: string, input: ProfileInput) {
  requireUserId(userId)
  return (await source()).updateProfile(userId, input)
}

export async function getPasswordHash(userId: string) {
  requireUserId(userId)
  return (await source()).getPasswordHash(userId)
}

export async function replacePassword(userId: string, expectedHash: string, password: string) {
  requireUserId(userId)
  return (await source()).replacePassword(userId, expectedHash, password)
}
