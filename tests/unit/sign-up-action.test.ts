import { beforeEach, describe, expect, it, vi } from 'vitest'
import { compare, getRounds } from 'bcryptjs'
import { DataConflict } from '@/lib/data/types'

const mocks = vi.hoisted(() => ({ auth: vi.fn(), createAccount: vi.fn(), signIn: vi.fn(), redirect: vi.fn() }))
vi.mock('@/lib/auth', () => ({ auth: mocks.auth, signIn: mocks.signIn, signOut: vi.fn() }))
vi.mock('@/lib/data', () => ({ createAccount: mocks.createAccount }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('next-auth', () => ({ AuthError: class AuthError extends Error {} }))
import { signUpAction } from '@/lib/actions/auth'

beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue(null) })
const input = { name: 'Alice Example', email: 'ALICE@example.test', password: 'password123' }

describe('sign-up action', () => {
  it('rejects invalid fields before creating an account', async () => {
    expect(await signUpAction({ name: '', email: 'invalid', password: 'short' })).toMatchObject({ success: false, code: 'VALIDATION_ERROR', fieldErrors: { email: expect.any(Array), password: expect.any(Array), name: expect.any(Array) } })
    expect(mocks.createAccount).not.toHaveBeenCalled()
  })
  it('does not disclose duplicate emails or data-layer details', async () => {
    mocks.createAccount.mockRejectedValue(new DataConflict('Duplicate email'))
    expect(await signUpAction(input)).toEqual({ success: false, error: 'Please check your details and try again.', code: 'SIGN_UP_FAILED' })
    expect(mocks.signIn).not.toHaveBeenCalled()
  })
  it('hashes with cost 12, normalizes the account and preserves the successful redirect', async () => {
    const redirected = new Error('Framework redirect')
    mocks.redirect.mockImplementation(() => { throw redirected })
    await expect(signUpAction(input)).rejects.toBe(redirected)
    const account = mocks.createAccount.mock.calls[0]![0] as { email: string; password: string; avatarInitials: string; avatarColorIndex: number }
    expect(account.email).toBe('alice@example.test')
    expect(account.avatarInitials).toBe('AE')
    expect(account.avatarColorIndex).toBeGreaterThanOrEqual(0)
    expect(account.avatarColorIndex).toBeLessThan(8)
    expect(getRounds(account.password)).toBe(12)
    expect(await compare(input.password, account.password)).toBe(true)
    expect(mocks.signIn).toHaveBeenCalledWith('credentials', { email: 'alice@example.test', password: input.password, redirect: false })
    expect(mocks.redirect).toHaveBeenCalledWith('/')
  })
})
