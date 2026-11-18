const readOperations = new Set(['findMany', 'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow', 'count', 'aggregate', 'groupBy'])

const scalarFields: Record<string, readonly string[]> = {
  Profile: ['id', 'userId', 'displayName', 'avatarInitials', 'avatarColorIndex', 'createdAt', 'updatedAt'],
  Project: ['id', 'name', 'description', 'ownerId', 'createdAt', 'updatedAt'],
  ProjectMember: ['id', 'projectId', 'userId', 'joinedAt'],
  Task: ['id', 'projectId', 'title', 'description', 'status', 'priority', 'dueDate', 'assigneeId', 'createdById', 'position', 'createdAt', 'updatedAt'],
  Comment: ['id', 'taskId', 'authorId', 'body', 'createdAt', 'updatedAt'],
  Notification: ['id', 'recipientId', 'type', 'taskId', 'read', 'createdAt'],
  Tag: ['id', 'name', 'projectId'],
  TaskTag: ['taskId', 'tagId'],
}

export function requireUserId(userId: string | undefined): asserts userId is string {
  if (!userId?.trim()) throw new Error('UNAUTHORIZED: data access requires an authenticated session')
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

// Intentionally read-only for Phase 0. Includes and writes require feature-specific rules:
// Prisma query extensions do not intercept nested relation reads or nested mutations.
export function scopeQuery(model: string | undefined, operation: string, args: Record<string, unknown>, userId: string) {
  requireUserId(userId)
  const fields = model ? scalarFields[model] : undefined
  if (!model || !fields || !readOperations.has(operation)) {
    throw new Error('FORBIDDEN: operation requires an explicit application access policy')
  }
  if (args.include || Object.entries(record(args.select)).some(([field, value]) => !fields.includes(field) || typeof value !== 'boolean')) {
    throw new Error('FORBIDDEN: nested relations and private fields require an explicit access policy')
  }
  // Aggregate field selectors must not expose passwordHash or relation data either.
  for (const key of ['_count', '_min', '_max', '_sum', '_avg']) {
    const selector = record(args[key])
    if (Object.keys(selector).some((field) => field !== '_all' && !fields.includes(field))) {
      throw new Error('FORBIDDEN: private aggregate field')
    }
  }
  if (Array.isArray(args.by) && args.by.some((field: unknown) => typeof field !== 'string' || !fields.includes(field))) {
    throw new Error('FORBIDDEN: private grouping field')
  }

  const project = { OR: [{ ownerId: userId }, { members: { some: { userId } } }] }
  const scopes: Record<string, Record<string, unknown>> = {
    Profile: { userId },
    Project: project,
    ProjectMember: { project },
    Task: { project },
    Comment: { task: { project } },
    Notification: { recipientId: userId },
    Tag: { project },
    TaskTag: { task: { project }, tag: { project } },
  }
  const where = record(args.where)
  return {
    ...args,
    where: { ...where, AND: [where, scopes[model]] },
    ...(model === 'Profile' && operation.startsWith('find') && !args.select
      ? { select: Object.fromEntries(fields.map((field) => [field, true])) }
      : {}),
  }
}
