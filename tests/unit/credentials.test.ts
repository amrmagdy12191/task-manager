import { describe, expect, it, vi, beforeEach } from 'vitest'
import { hash } from 'bcryptjs'

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }))
vi.mock('@/lib/data', () => ({ findCredentialsUser: findUnique }))
import { authorizeCredentials } from '@/lib/credentials'

beforeEach(() => { findUnique.mockReset() })

describe('credentials verification', () => {
  it('rejects malformed input before querying', async () => {
    expect(await authorizeCredentials({ email: 'bad', password: '' })).toBeNull()
    expect(findUnique).not.toHaveBeenCalled()
  })
  it('rejects unknown users and accounts without passwords', async () => {
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ profile: null })
    expect(await authorizeCredentials({ email: 'alice@example.com', password: 'anything' })).toBeNull()
    expect(await authorizeCredentials({ email: 'alice@example.com', password: 'anything' })).toBeNull()
  })
  it('rejects incorrect passwords and returns only public identity for valid passwords', async () => {
    const passwordHash = await hash('correct-test-password', 4)
    findUnique.mockResolvedValue({ id: 'alice', email: 'alice@example.com', image: null, password: passwordHash, profile: { displayName: 'Alice' } })
    expect(await authorizeCredentials({ email: 'alice@example.com', password: 'wrong' })).toBeNull()
    expect(await authorizeCredentials({ email: ' ALICE@example.com ', password: 'correct-test-password' })).toEqual({
      id: 'alice', name: 'Alice', email: 'alice@example.com', image: null,
    })
    expect(findUnique).toHaveBeenLastCalledWith('alice@example.com')
  })
})
