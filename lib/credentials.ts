import { compare } from 'bcryptjs'
import { z } from 'zod'
import { findCredentialsUser } from './data'

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72),
})

export async function authorizeCredentials(credentials: Partial<Record<string, unknown>>) {
  const parsed = credentialsSchema.safeParse(credentials)
  if (!parsed.success) return null
  const user = await findCredentialsUser(parsed.data.email)
  if (!user?.profile?.passwordHash || !(await compare(parsed.data.password, user.profile.passwordHash))) return null
  return { id: user.id, name: user.profile.displayName, email: user.email, image: user.image }
}
