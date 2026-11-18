import { describe, expect, it } from 'vitest'
import { scopeQuery, requireUserId } from '@/lib/access-control'

describe('application access control', () => {
  it('rejects missing identity', () => {
    expect(() => requireUserId('')).toThrow(/UNAUTHORIZED/)
    expect(() => scopeQuery('Profile', 'findMany', {}, '')).toThrow(/UNAUTHORIZED/)
  })
  it('combines caller filters with the session scope', () => {
    const scoped = scopeQuery('Profile', 'findUnique', { where: { id: 'other-profile' } }, 'alice')
    expect(scoped.where).toEqual({ AND: [{ id: 'other-profile' }, { userId: 'alice' }] })
    expect(scoped.select).not.toHaveProperty('passwordHash')
  })
  it.each(['Project', 'ProjectMember', 'Task', 'Comment', 'Tag', 'TaskTag', 'Notification'])('scopes %s reads', (model) => {
    expect(JSON.stringify(scopeQuery(model, 'findMany', {}, 'alice').where)).toContain('alice')
  })
  it('blocks raw operations, unregistered models, and writes', () => {
    expect(() => scopeQuery(undefined, '$queryRaw', {}, 'alice')).toThrow(/FORBIDDEN/)
    expect(() => scopeQuery('Account', 'findMany', {}, 'alice')).toThrow(/FORBIDDEN/)
    expect(() => scopeQuery('Task', 'create', {}, 'alice')).toThrow(/FORBIDDEN/)
    expect(() => scopeQuery('Profile', 'updateMany', {}, 'alice')).toThrow(/FORBIDDEN/)
  })
  it('scopes User reads to the session owner', () => {
    const scoped = scopeQuery('User', 'findUnique', { where: { id: 'alice' } }, 'alice')
    expect(scoped.where).toEqual({ AND: [{ id: 'alice' }, { id: 'alice' }] })
  })
  it('prevents relation includes and secret selection bypasses', () => {
    expect(() => scopeQuery('Profile', 'findMany', { include: { user: true } }, 'alice')).toThrow(/FORBIDDEN/)
    expect(() => scopeQuery('Profile', 'findMany', { select: { user: true } }, 'alice')).toThrow(/FORBIDDEN/)
    expect(() => scopeQuery('Profile', 'findMany', { select: { passwordHash: true } }, 'alice')).toThrow(/FORBIDDEN/)
  })
})
