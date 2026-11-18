import { db } from '@/lib/db'
import { databaseRead } from '@/lib/db-timeout'
import { withAccessControl } from '@/lib/db-middleware'
import { Prisma } from '@prisma/client'
import { DataConflict, type NewAccount, type ProfileInput } from './types'

export async function findCredentialsUser(email: string) {
  return databaseRead(db.user.findUnique({
    where: { email },
    // Authentication-only selection; authorizeCredentials returns public identity fields.
    select: { id: true, email: true, name: true, image: true, password: true, profile: { select: { displayName: true } } },
  }))
}

export async function getUserProfile(userId: string) {
  return databaseRead(withAccessControl(userId).profile.findUnique({
    where: { userId },
    select: { displayName: true, avatarInitials: true, avatarColorIndex: true },
  }))
}

export async function checkDataConnection() {
  await databaseRead(db.$queryRaw`SELECT 1`)
}

export async function getPublicProfile(userId: string) {
  const [profile, user] = await Promise.all([
    getUserProfile(userId),
    databaseRead(db.user.findUnique({ where: { id: userId }, select: { email: true } })),
  ])
  return profile && user ? { ...profile, email: user.email } : null
}

export async function createAccount(input: NewAccount) {
  try {
    return await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: input.email, name: input.displayName, password: input.password },
        select: { id: true },
      })
      await tx.profile.create({ data: { userId: user.id, displayName: input.displayName, avatarInitials: input.avatarInitials, avatarColorIndex: input.avatarColorIndex }, select: { id: true } })
      return user
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new DataConflict('Account could not be created')
    throw error
  }
}

export async function updateProfile(userId: string, input: ProfileInput) {
  return db.$transaction(async (tx) => {
    const profile = await tx.profile.update({ where: { userId }, data: input, select: { displayName: true, avatarInitials: true, avatarColorIndex: true } })
    await tx.user.update({ where: { id: userId }, data: { name: input.displayName }, select: { id: true } })
    return profile
  })
}

export async function getPasswordHash(userId: string) {
  // Internal verification only; the hash is never included in an action response.
  return (await databaseRead(db.user.findUnique({ where: { id: userId }, select: { password: true } })))?.password ?? null
}

export async function replacePassword(userId: string, expectedHash: string, password: string) {
  const result = await db.user.updateMany({ where: { id: userId, password: expectedHash }, data: { password } })
  return result.count === 1
}
