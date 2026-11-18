'use server'

import { auth } from '@/lib/auth'
import { requireUserId } from '@/lib/access-control'
import { getUserProfile } from '@/lib/data'
import { initials } from '@/lib/initials'
import type { ActionResult } from '@/lib/action-result'

interface SessionIdentity { userId: string; email: string; displayName: string; avatarInitials: string; avatarColorIndex: number }

export async function getSession(): Promise<ActionResult<SessionIdentity>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Sign in to continue', code: 'UNAUTHORIZED' }
  requireUserId(session.user.id)
  try {
    const profile = await getUserProfile(session.user.id)
    const displayName = profile?.displayName ?? session.user.name ?? session.user.email ?? 'User'
    return { success: true, data: {
      userId: session.user.id,
      email: session.user.email ?? '',
      displayName,
      avatarInitials: profile?.avatarInitials ?? initials(displayName),
      avatarColorIndex: profile?.avatarColorIndex ?? 0,
    } }
  } catch {
    return { success: false, error: 'Database unavailable', code: 'DB_UNREACHABLE' }
  }
}
