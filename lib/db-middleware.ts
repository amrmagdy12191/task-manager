import { db } from './db'
import { requireUserId, scopeQuery } from './access-control'

export { requireUserId } from './access-control'

export function withAccessControl(userId: string) {
  requireUserId(userId)
  return db.$extends({
    name: 'session-scoped-foundation-reads',
    query: {
      async $allOperations({ args, query, model, operation }) {
        return query(scopeQuery(model, operation, args as Record<string, unknown>, userId) as typeof args)
      },
    },
  })
}
