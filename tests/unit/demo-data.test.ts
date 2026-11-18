// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { readDemoData } from '@/lib/data/demo'

vi.mock('@/lib/env', () => ({ env: { DATA_SOURCE: 'demo', DEMO_DATA_FILE: 'data/demo-data.json' } }))
vi.mock('@/lib/db', () => { throw new Error('Demo mode must not load PostgreSQL') })

import { authorizeCredentials } from '@/lib/credentials'
import { checkDataConnection, getUserProfile } from '@/lib/data'

describe('database-free demo mode', () => {
  it('checks health and serves only the requested public profile without PostgreSQL', async () => {
    await expect(checkDataConnection()).resolves.toBeUndefined()
    expect(await getUserProfile('demo-alex')).toEqual({ displayName: 'Alex Morgan', avatarInitials: 'AM', avatarColorIndex: 0 })
    expect(await getUserProfile('demo-sam')).toEqual({ displayName: 'Sam Patel', avatarInitials: 'SP', avatarColorIndex: 0 })
    expect(await getUserProfile('unknown')).toBeNull()
    await expect(getUserProfile('')).rejects.toThrow(/UNAUTHORIZED/)
  })

  it('verifies the shared demo password and keeps hashes out of the returned identity', async () => {
    expect(await authorizeCredentials({ email: ' DEMO@taskflow.local ', password: 'TaskFlowDemo123!' })).toEqual({
      id: 'demo-alex', name: 'Alex Morgan', email: 'demo@taskflow.local', image: null,
    })
    expect(await authorizeCredentials({ email: 'demo@taskflow.local', password: 'wrong' })).toBeNull()
    expect(await authorizeCredentials({ email: 'unknown@taskflow.local', password: 'TaskFlowDemo123!' })).toBeNull()
  })

  it('has consistent fixture references, memberships and task tags', async () => {
    const data = await readDemoData()
    const userIds = new Set(data.users.map((user) => user.id))
    const projects = new Map(data.projects.map((project) => [project.id, project]))
    const tasks = new Map(data.tasks.map((task) => [task.id, task]))
    const tags = new Map(data.tags.map((tag) => [tag.id, tag]))
    const isMember = (userId: string, projectId: string) => data.projectMembers.some((member) => member.userId === userId && member.projectId === projectId)
    for (const profile of data.profiles) expect(userIds.has(profile.userId)).toBe(true)
    expect(new Set(data.profiles.map((profile) => profile.userId)).size).toBe(data.users.length)
    for (const project of data.projects) expect(isMember(project.ownerId, project.id)).toBe(true)
    for (const member of data.projectMembers) {
      expect(userIds.has(member.userId)).toBe(true)
      expect(projects.has(member.projectId)).toBe(true)
    }
    for (const task of data.tasks) {
      expect(projects.has(task.projectId)).toBe(true)
      expect(isMember(task.createdById, task.projectId)).toBe(true)
      if (task.assigneeId) expect(isMember(task.assigneeId, task.projectId)).toBe(true)
    }
    for (const comment of data.comments) {
      expect(tasks.has(comment.taskId)).toBe(true)
      expect(isMember(comment.authorId, tasks.get(comment.taskId)?.projectId ?? '')).toBe(true)
    }
    for (const notification of data.notifications) {
      expect(userIds.has(notification.recipientId)).toBe(true)
      if (notification.taskId) expect(tasks.has(notification.taskId)).toBe(true)
    }
    for (const tag of data.tags) expect(projects.has(tag.projectId)).toBe(true)
    for (const link of data.taskTags) {
      expect(tasks.has(link.taskId)).toBe(true)
      expect(tags.has(link.tagId)).toBe(true)
      expect(tasks.get(link.taskId)?.projectId).toBe(tags.get(link.tagId)?.projectId)
    }
  })
})
