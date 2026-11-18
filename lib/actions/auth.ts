'use server'

import { auth, signOut } from '@/lib/auth'
import { requireUserId } from '@/lib/access-control'

export async function signOutAction() {
  const session = await auth()
  requireUserId(session?.user?.id)
  await signOut({ redirectTo: '/sign-in' })
}
