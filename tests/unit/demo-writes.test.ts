// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { compare, hash } from 'bcryptjs'

const config = vi.hoisted(() => ({ DATA_SOURCE: 'demo', DEMO_DATA_FILE: '' }))
vi.mock('@/lib/env', () => ({ env: config }))
import { createAccount, getPublicProfile, getPasswordHash, updateProfile, replacePassword, readDemoData } from '@/lib/data/demo'
import { DataConflict } from '@/lib/data/types'

let directory: string
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'taskflow-demo-'))
  config.DEMO_DATA_FILE = join(directory, 'data.json')
})
afterAll(async () => { await rm(directory, { recursive: true, force: true }) })

describe('persistent demo writes', () => {
  it('serializes simultaneous sign-ups and keeps user/profile creation atomic', async () => {
    const input = { email: 'concurrent@example.test', password: await hash('password123', 12), displayName: 'Concurrent User', avatarInitials: 'CU', avatarColorIndex: 3 }
    const results = await Promise.allSettled([createAccount(input), createAccount(input)])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({ reason: expect.any(DataConflict) })
    const data = await readDemoData()
    expect(data.users.filter((user) => user.email === input.email)).toHaveLength(1)
    const id = data.users.find((user) => user.email === input.email)!.id
    expect(data.profiles.filter((profile) => profile.userId === id)).toHaveLength(1)
    expect(await getPublicProfile(id)).toEqual({ email: input.email, displayName: input.displayName, avatarInitials: 'CU', avatarColorIndex: 3 })
    expect(await compare('password123', (await getPasswordHash(id))!)).toBe(true)
    const persisted = JSON.parse(await readFile(config.DEMO_DATA_FILE, 'utf8'))
    expect(persisted.users).toHaveLength(4)
  })

  it('updates only the owner, persists edits and prevents stale password overwrites', async () => {
    const before = await getPublicProfile('demo-sam')
    await updateProfile('demo-alex', { displayName: 'New Name', avatarInitials: 'NN', avatarColorIndex: 7 })
    expect(await getPublicProfile('demo-alex')).toMatchObject({ displayName: 'New Name', avatarColorIndex: 7 })
    expect(await getPublicProfile('demo-sam')).toEqual(before)
    const oldHash = (await getPasswordHash('demo-alex'))!
    const newHash = await hash('newpassword456', 12)
    expect(await replacePassword('demo-alex', oldHash, newHash)).toBe(true)
    expect(await replacePassword('demo-alex', oldHash, 'stale-write')).toBe(false)
    expect(await compare('newpassword456', (await getPasswordHash('demo-alex'))!)).toBe(true)
    expect(await compare('TaskFlowDemo123!', (await getPasswordHash('demo-alex'))!)).toBe(false)
    const original = JSON.parse(await readFile('data/demo-data.json', 'utf8'))
    expect(original.users.find((user: { id: string }) => user.id === 'demo-alex').name).toBe('Alex Morgan')
  })
})
