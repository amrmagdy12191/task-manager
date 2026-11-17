import { db } from '@/lib/db'
import { databaseRead } from '@/lib/db-timeout'
import { withAccessControl } from '@/lib/db-middleware'

export async function findCredentialsUser(email: string) {
  return databaseRead(db.user.findUnique({
    where: { email },
    include: { profile: { select: { passwordHash: true, displayName: true } } },
  }))
}

export async function getUserProfile(userId: string) {
  return databaseRead(withAccessControl(userId).profile.findUnique({
    where: { userId },
    select: { displayName: true, avatarInitials: true },
  }))
}

export async function checkDataConnection() {
  await databaseRead(db.$queryRaw`SELECT 1`)
}
