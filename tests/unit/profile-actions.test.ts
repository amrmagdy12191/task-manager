import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hash } from 'bcryptjs'

const mocks = vi.hoisted(() => ({ auth: vi.fn(), getPublicProfile: vi.fn(), updateProfile: vi.fn(), getPasswordHash: vi.fn(), replacePassword: vi.fn(), revalidatePath: vi.fn() }))
vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/data', () => mocks)
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
import { getProfileAction, updateProfileAction, changePasswordAction } from '@/lib/actions/profile'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.auth.mockResolvedValue({ user: { id: 'alice' } })
})

describe('profile action authorization and validation', () => {
  it('rejects all unauthenticated profile access before data queries', async () => {
    mocks.auth.mockResolvedValue(null)
    for (const action of [getProfileAction, () => updateProfileAction({}), () => changePasswordAction({})]) {
      expect(await action()).toMatchObject({ success: false, code: 'UNAUTHORIZED' })
    }
    expect(mocks.getPublicProfile).not.toHaveBeenCalled()
    expect(mocks.updateProfile).not.toHaveBeenCalled()
    expect(mocks.getPasswordHash).not.toHaveBeenCalled()
  })
  it('uses the session identity and strips attempts to edit other accounts', async () => {
    const input = { displayName: 'Alice Updated', avatarInitials: 'AU', avatarColorIndex: 3 }
    mocks.updateProfile.mockResolvedValue(input)
    expect(await updateProfileAction({ ...input, userId: 'bob', password: 'do-not-store' })).toEqual({ success: true, data: input })
    expect(mocks.updateProfile).toHaveBeenCalledWith('alice', input)
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })
  it('returns field errors for blank names and invalid colors', async () => {
    expect(await updateProfileAction({ displayName: '  ', avatarInitials: '', avatarColorIndex: 8 })).toMatchObject({ success: false, code: 'VALIDATION_ERROR', fieldErrors: { displayName: expect.any(Array), avatarColorIndex: expect.any(Array) } })
    expect(mocks.updateProfile).not.toHaveBeenCalled()
  })
  it('rejects wrong current passwords without writing', async () => {
    mocks.getPasswordHash.mockResolvedValue(await hash('original-password', 4))
    expect(await changePasswordAction({ currentPassword: 'wrong', newPassword: 'new-password', confirmPassword: 'new-password' })).toMatchObject({ success: false, code: 'WRONG_PASSWORD' })
    expect(mocks.replacePassword).not.toHaveBeenCalled()
  })
  it('checks new password length and confirmation on the server', async () => {
    expect(await changePasswordAction({ currentPassword: 'original', newPassword: 'short', confirmPassword: 'different' })).toMatchObject({ success: false, code: 'VALIDATION_ERROR' })
    expect(mocks.getPasswordHash).not.toHaveBeenCalled()
  })
})
