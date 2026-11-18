'use server'

import { auth } from '@/lib/auth'
import { requireUserId } from '@/lib/access-control'
import { getPublicProfile, updateProfile, getPasswordHash, replacePassword } from '@/lib/data'
import { changePasswordSchema, profileSchema, fieldErrors } from '@/lib/auth-validation'
import { compare, hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-result'
import type { ProfileInput, PublicProfile } from '@/lib/data/types'

export async function getProfileAction(): Promise<ActionResult<PublicProfile>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Sign in to continue.', code: 'UNAUTHORIZED' }
  requireUserId(session.user.id)
  try {
    const profile = await getPublicProfile(session.user.id)
    return profile ? { success: true, data: profile } : { success: false, error: 'Profile unavailable.', code: 'NOT_FOUND' }
  } catch { return { success: false, error: 'Unable to load your profile. Please try again.', code: 'DB_ERROR' } }
}

export async function updateProfileAction(input: unknown): Promise<ActionResult<ProfileInput>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Sign in to continue.', code: 'UNAUTHORIZED' }
  requireUserId(session.user.id)
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Please check the highlighted fields.', code: 'VALIDATION_ERROR', fieldErrors: fieldErrors(parsed.error) }
  try {
    const profile = await updateProfile(session.user.id, parsed.data)
    revalidatePath('/', 'layout')
    return { success: true, data: profile }
  } catch { return { success: false, error: 'Unable to save your profile. Please try again.', code: 'DB_ERROR' } }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult<{ success: true }>> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Sign in to continue.', code: 'UNAUTHORIZED' }
  requireUserId(session.user.id)
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Please check the highlighted fields.', code: 'VALIDATION_ERROR', fieldErrors: fieldErrors(parsed.error) }
  try {
    const currentHash = await getPasswordHash(session.user.id)
    if (!currentHash || !(await compare(parsed.data.currentPassword, currentHash))) {
      return { success: false, error: 'Current password is incorrect.', code: 'WRONG_PASSWORD', fieldErrors: { currentPassword: ['Current password is incorrect.'] } }
    }
    const newHash = await hash(parsed.data.newPassword, 12)
    if (!(await replacePassword(session.user.id, currentHash, newHash))) return { success: false, error: 'Current password is incorrect.', code: 'WRONG_PASSWORD' }
    return { success: true, data: { success: true } }
  } catch { return { success: false, error: 'Unable to update your password. Please try again.', code: 'DB_ERROR' } }
}
