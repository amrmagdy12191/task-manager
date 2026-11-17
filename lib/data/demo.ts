import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import { requireUserId } from '@/lib/access-control'

const id = z.string().min(1)
const timestamp = z.string().datetime()
const timestamps = { createdAt: timestamp, updatedAt: timestamp }

const demoSchema = z.object({
  version: z.literal(1),
  users: z.array(z.object({ id, name: z.string(), email: z.string().email(), image: z.string().nullable() })).min(1),
  profiles: z.array(z.object({ id, userId: id, displayName: z.string().min(1).max(100), avatarInitials: z.string().max(2), passwordHash: z.string().startsWith('$2'), ...timestamps })),
  projects: z.array(z.object({ id, name: z.string(), description: z.string(), ownerId: id, ...timestamps })),
  projectMembers: z.array(z.object({ id, projectId: id, userId: id, joinedAt: timestamp })),
  tasks: z.array(z.object({
    id, projectId: id, title: z.string().max(200), description: z.string(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    dueDate: timestamp.nullable(), assigneeId: id.nullable(), createdById: id, position: z.number(), ...timestamps,
  })),
  comments: z.array(z.object({ id, taskId: id, authorId: id, body: z.string().max(2000), ...timestamps })),
  notifications: z.array(z.object({ id, recipientId: id, type: z.enum(['TASK_ASSIGNED', 'MENTIONED']), taskId: id.nullable(), read: z.boolean(), createdAt: timestamp })),
  tags: z.array(z.object({ id, name: z.string().max(50), projectId: id })),
  taskTags: z.array(z.object({ taskId: id, tagId: id })),
})

// This module uses Node filesystem APIs and must remain on the server. The file is
// outside public/; hashes and fixture contents are never returned by session APIs.
export async function readDemoData() {
  const contents = await readFile(join(process.cwd(), 'data/demo-data.json'), 'utf8')
  return demoSchema.parse(JSON.parse(contents))
}

export async function findCredentialsUser(email: string) {
  const data = await readDemoData()
  const user = data.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase())
  if (!user) return null
  const profile = data.profiles.find((candidate) => candidate.userId === user.id)
  return {
    ...user,
    profile: profile ? { displayName: profile.displayName, passwordHash: profile.passwordHash } : null,
  }
}

export async function getUserProfile(userId: string) {
  requireUserId(userId)
  const data = await readDemoData()
  const profile = data.profiles.find((candidate) => candidate.userId === userId)
  return profile ? { displayName: profile.displayName, avatarInitials: profile.avatarInitials } : null
}

export async function checkDataConnection() {
  await readDemoData()
}
