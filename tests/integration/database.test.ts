import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { withAccessControl } from '@/lib/db-middleware'
import { createAccount, getPublicProfile, updateProfile, getPasswordHash, replacePassword } from '@/lib/data/postgres'
import { DataConflict } from '@/lib/data/types'
import { hash, compare } from 'bcryptjs'

// Only this explicit test suite writes temporary fixtures; never point it at a shared DB.
if (env.DATA_SOURCE !== 'postgres' || !['localhost', '127.0.0.1'].includes(new URL(env.DATABASE_URL).hostname)) {
  throw new Error('Database integration tests require a local PostgreSQL instance')
}

const runId = randomUUID()
const alice = `alice-${runId}`
const bob = `bob-${runId}`
const users = [alice, bob]
const scoped = withAccessControl(alice)

beforeAll(async () => {
  for (const userId of users) {
    await db.user.create({ data: {
      id: userId, email: `${userId}@example.test`, password: 'private-test-hash',
      profile: { create: { id: `profile-${userId}`, displayName: userId, avatarInitials: 'TS' } },
    } })
    await db.project.create({ data: {
      id: `project-${userId}`, name: 'Isolation fixture', ownerId: userId,
      members: { create: { id: `member-${userId}`, userId } },
      tasks: { create: { id: `task-${userId}`, title: 'Fixture', createdById: userId, comments: { create: { id: `comment-${userId}`, authorId: userId, body: 'Private comment' } } } },
      tags: { create: { id: `tag-${userId}`, name: 'Fixture' } },
    } })
    await db.taskTag.create({ data: { taskId: `task-${userId}`, tagId: `tag-${userId}` } })
    await db.notification.create({ data: { id: `notification-${userId}`, recipientId: userId, type: 'TASK_ASSIGNED', taskId: `task-${userId}` } })
  }
})

afterAll(async () => {
  await db.project.deleteMany({ where: { id: { in: users.map((id) => `project-${id}`) } } })
  await db.user.deleteMany({ where: { id: { in: users } } })
  await db.$disconnect()
})

describe('baseline schema and real database access policies', () => {
  it('atomically creates an account and profile, handles duplicates, updates and changes credentials', async () => {
    const input = { email: `signup-${runId}@example.test`, password: await hash('password123', 12), displayName: 'New User', avatarInitials: 'NU', avatarColorIndex: 5 }
    const account = await createAccount(input)
    users.push(account.id)
    expect(Object.keys(account)).toEqual(['id'])
    await expect(createAccount(input)).rejects.toBeInstanceOf(DataConflict)
    expect(await getPublicProfile(account.id)).toEqual({ email: input.email, displayName: 'New User', avatarInitials: 'NU', avatarColorIndex: 5 })
    await updateProfile(account.id, { displayName: 'Edited User', avatarInitials: 'EU', avatarColorIndex: 2 })
    expect(await getPublicProfile(account.id)).toMatchObject({ displayName: 'Edited User', avatarInitials: 'EU' })
    expect(await db.user.findUnique({ where: { id: account.id }, select: { name: true } })).toEqual({ name: 'Edited User' })
    const newHash = await hash('newpassword456', 12)
    expect(await replacePassword(account.id, input.password, newHash)).toBe(true)
    expect(await replacePassword(account.id, input.password, 'stale')).toBe(false)
    expect(await compare('password123', (await getPasswordHash(account.id))!)).toBe(false)
    expect(await compare('newpassword456', (await getPasswordHash(account.id))!)).toBe(true)
  })

  it('rolls back User creation if its Profile violates a database constraint', async () => {
    const email = `rollback-${runId}@example.test`
    await expect(createAccount({ email, password: 'private-test-hash', displayName: 'Invalid', avatarInitials: 'I', avatarColorIndex: 8 })).rejects.toThrow()
    expect(await db.user.findUnique({ where: { email }, select: { id: true } })).toBeNull()
  })
  it('contains all twelve expected models', async () => {
    const rows = await db.$queryRaw<Array<{ table_name: string }>>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    const names = rows.map((row) => row.table_name)
    for (const model of ['User', 'Account', 'Session', 'VerificationToken', 'Profile', 'Project', 'ProjectMember', 'Task', 'Comment', 'Notification', 'Tag', 'TaskTag']) {
      expect(names).toContain(model)
    }
  })

  it('isolates all application tables and never exposes password hashes', async () => {
    const profiles = await scoped.profile.findMany({ where: { userId: { in: users } } })
    expect(profiles.map((profile) => profile.userId)).toEqual([alice])
    expect(profiles[0]).not.toHaveProperty('passwordHash')
    expect(await scoped.profile.findUnique({ where: { userId: bob } })).toBeNull()
    expect((await scoped.project.findMany({ where: { ownerId: { in: users } } })).map((row) => row.ownerId)).toEqual([alice])
    expect((await scoped.projectMember.findMany({ where: { userId: { in: users } } })).map((row) => row.userId)).toEqual([alice])
    expect((await scoped.task.findMany({ where: { createdById: { in: users } } })).map((row) => row.createdById)).toEqual([alice])
    expect((await scoped.comment.findMany({ where: { authorId: { in: users } } })).map((row) => row.authorId)).toEqual([alice])
    expect((await scoped.notification.findMany({ where: { recipientId: { in: users } } })).map((row) => row.recipientId)).toEqual([alice])
    expect((await scoped.tag.findMany({ where: { id: { in: users.map((id) => `tag-${id}`) } } })).map((row) => row.id)).toEqual([`tag-${alice}`])
    expect((await scoped.taskTag.findMany({ where: { taskId: { in: users.map((id) => `task-${id}`) } } })).map((row) => row.taskId)).toEqual([`task-${alice}`])
  })

  it('allows equal project-member reads', async () => {
    const membership = await db.projectMember.create({ data: { projectId: `project-${bob}`, userId: alice } })
    try {
      expect(await scoped.task.findUnique({ where: { id: `task-${bob}` } })).toMatchObject({ id: `task-${bob}` })
    } finally { await db.projectMember.delete({ where: { id: membership.id } }) }
  })

  it('blocks direct raw queries and writes on the scoped client', async () => {
    await expect(scoped.$queryRaw`SELECT 1`).rejects.toThrow(/FORBIDDEN/)
    await expect(scoped.profile.update({ where: { userId: alice }, data: { displayName: 'Changed' } })).rejects.toThrow(/FORBIDDEN/)
    await expect(scoped.user.findMany()).rejects.toThrow(/FORBIDDEN/)
  })
})
