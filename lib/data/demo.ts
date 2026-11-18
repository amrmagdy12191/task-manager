import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { requireUserId } from '@/lib/access-control'
import { env } from '@/lib/env'
import { DataConflict, type NewAccount, type ProfileInput } from './types'

const id = z.string().min(1)
const timestamp = z.string().datetime()
const timestamps = { createdAt: timestamp, updatedAt: timestamp }

const demoSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  users: z.array(z.object({ id, name: z.string(), email: z.string().email(), image: z.string().nullable(), password: z.string().nullable().optional() })).min(1),
  profiles: z.array(z.object({ id, userId: id, displayName: z.string().min(1).max(100), avatarInitials: z.string().max(2), passwordHash: z.string().optional(), avatarColorIndex: z.number().int().min(0).max(7).default(0), ...timestamps })),
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
}).transform((data) => ({
  ...data,
  version: 2 as const,
  users: data.users.map((user) => ({ ...user, password: user.password ?? data.profiles.find((profile) => profile.userId === user.id)?.passwordHash ?? null })),
  profiles: data.profiles.map(({ passwordHash: legacyHash, ...profile }) => { void legacyHash; return profile }),
}))

type DemoData = z.output<typeof demoSchema>
const globalStore = globalThis as unknown as { demoWrites?: Map<string, Promise<unknown>> }
const writes = globalStore.demoWrites ??= new Map()
// Runtime data is created locally, never bundled in a deployment artifact.
function dataFile() { return resolve(/* turbopackIgnore: true */ env.DEMO_DATA_FILE ?? '.cache/demo-data.json') }

// This module uses Node filesystem APIs and must remain on the server. The file is
// outside public/; hashes and fixture contents are never returned by session APIs.
export async function readDemoData() {
  let contents: string
  try { contents = await readFile(/* turbopackIgnore: true */ dataFile(), 'utf8') }
  catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
    contents = await readFile(join(process.cwd(), 'data/demo-data.json'), 'utf8')
  }
  return demoSchema.parse(JSON.parse(contents))
}

async function mutate<T>(operation: (data: DemoData) => T): Promise<T> {
  const path = dataFile()
  const previous = writes.get(path) ?? Promise.resolve()
  const next = previous.then(async () => {
    const data = await readDemoData()
    // operation MUST mutate `data` in place; its return value is passed back to callers.
    const result = operation(data)
    await mkdir(dirname(path), { recursive: true })
    const temporary = `${path}.${randomUUID()}.tmp`
    try {
      await writeFile(temporary, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 })
      await rename(temporary, path)
    } finally { await unlink(temporary).catch(() => {}) }
    return result
  })
  writes.set(path, next)
  try { return await next } finally { if (writes.get(path) === next) writes.delete(path) }
}

export async function findCredentialsUser(email: string) {
  const data = await readDemoData()
  const user = data.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase())
  if (!user) return null
  const profile = data.profiles.find((candidate) => candidate.userId === user.id)
  return {
    ...user,
    profile: profile ? { displayName: profile.displayName } : null,
  }
}

export async function getUserProfile(userId: string) {
  requireUserId(userId)
  const data = await readDemoData()
  const profile = data.profiles.find((candidate) => candidate.userId === userId)
  return profile ? { displayName: profile.displayName, avatarInitials: profile.avatarInitials, avatarColorIndex: profile.avatarColorIndex } : null
}

export async function checkDataConnection() {
  await readDemoData()
}

export async function getPublicProfile(userId: string) {
  const data = await readDemoData()
  const user = data.users.find((entry) => entry.id === userId)
  const profile = data.profiles.find((entry) => entry.userId === userId)
  return user && profile ? { email: user.email, displayName: profile.displayName, avatarInitials: profile.avatarInitials, avatarColorIndex: profile.avatarColorIndex } : null
}

export async function createAccount(input: NewAccount) {
  return mutate((data) => {
    if (data.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) throw new DataConflict('Account could not be created')
    const id = randomUUID()
    const now = new Date().toISOString()
    data.users.push({ id, email: input.email, password: input.password, name: input.displayName, image: null })
    data.profiles.push({ id: randomUUID(), userId: id, displayName: input.displayName, avatarInitials: input.avatarInitials, avatarColorIndex: input.avatarColorIndex, createdAt: now, updatedAt: now })
    return { id }
  })
}

export async function updateProfile(userId: string, input: ProfileInput) {
  return mutate((data) => {
    const profile = data.profiles.find((entry) => entry.userId === userId)
    const user = data.users.find((entry) => entry.id === userId)
    if (!profile || !user) throw new Error('NOT_FOUND')
    Object.assign(profile, input, { updatedAt: new Date().toISOString() })
    user.name = input.displayName
    return { displayName: profile.displayName, avatarInitials: profile.avatarInitials, avatarColorIndex: profile.avatarColorIndex }
  })
}

export async function getPasswordHash(userId: string) {
  return (await readDemoData()).users.find((user) => user.id === userId)?.password ?? null
}

export async function replacePassword(userId: string, expectedHash: string, password: string) {
  return mutate((data) => {
    const user = data.users.find((entry) => entry.id === userId)
    if (!user || user.password !== expectedHash) return false
    user.password = password
    return true
  })
}
