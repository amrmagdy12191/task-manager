'use server'

import { auth, signIn, signOut } from '@/lib/auth'
import { requireUserId } from '@/lib/access-control'
import { AuthError } from 'next-auth'
import { hash } from 'bcryptjs'
import { redirect } from 'next/navigation'
import { createAccount } from '@/lib/data'
import { signUpSchema, fieldErrors } from '@/lib/auth-validation'
import { assignAvatarColor, deriveInitials } from '@/lib/avatar'
import { DataConflict } from '@/lib/data/types'
import type { ActionResult } from '@/lib/action-result'

export async function signOutAction() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')
  requireUserId(session?.user?.id)
  await signOut({ redirectTo: '/sign-in' })
}

export async function signUpAction(input: unknown): Promise<ActionResult<{ userId: string }>> {
  const session = await auth()
  if (session?.user?.id) redirect('/')
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Please check your details and try again.', code: 'VALIDATION_ERROR', fieldErrors: fieldErrors(parsed.error) }
  try {
    await createAccount({
      email: parsed.data.email, password: await hash(parsed.data.password, 12),
      displayName: parsed.data.name, avatarInitials: deriveInitials(parsed.data.name), avatarColorIndex: assignAvatarColor(parsed.data.email),
    })
  } catch (error) {
    return error instanceof DataConflict
      ? { success: false, error: 'Please check your details and try again.', code: 'SIGN_UP_FAILED' }
      : { success: false, error: 'Something went wrong. Please try again.', code: 'SIGN_UP_FAILED' }
  }
  // Only AuthError is handled here; never swallow Next.js redirects.
  try { await signIn('credentials', { email: parsed.data.email, password: parsed.data.password, redirect: false }) }
  catch (error) {
    if (error instanceof AuthError) return { success: false, error: 'Your account is ready. Please sign in to continue.', code: 'SIGN_UP_FAILED' }
    throw error
  }
  redirect('/')
}
