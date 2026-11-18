import { compare } from 'bcryptjs'
import { z } from 'zod'
import { findCredentialsUser } from './data'

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72).refine((value) => new TextEncoder().encode(value).length <= 72),
})

export async function authorizeCredentials(credentials: Partial<Record<string, unknown>>) {
  const parsed = credentialsSchema.safeParse(credentials)
  if (!parsed.success) return null
  const user = await findCredentialsUser(parsed.data.email)
  if (!user?.password || !(await compare(parsed.data.password, user.password))) return null
  return { id: user.id, name: user.profile?.displayName ?? user.name ?? '', email: user.email, image: user.image }
}
