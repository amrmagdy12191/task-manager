# Contract: Server Actions

**Feature**: 001-foundation-architecture
**Date**: 2026-11-17

Server Actions are the primary write path for TaskFlow. All actions are defined in
`lib/actions/` and must:
1. Call `auth()` from `lib/auth.ts` and throw `UNAUTHORIZED` if no session.
2. Validate input with Zod before any Prisma call.
3. Return a typed `ActionResult<T>` discriminated union.

The sign-out action is a redirecting Auth.js mutation and returns no result payload.
`healthCheck` is an internal server helper used by the deliberately public health endpoint;
it does not access user data and does not require a session.

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

---

## Foundation-Phase Actions

Only the actions needed to validate the Phase 0 foundation are listed here.
Feature-phase actions (task CRUD, comments, etc.) are specified in their respective
feature specs.

---

### getSession

Returns the current user's session and profile data for the welcome card.

**Input**: none (reads session cookie server-side)

**Output**
```ts
{
  success: true,
  data: {
    userId: string,
    email: string,
    displayName: string,
    avatarInitials: string,
  }
}
```
**Errors**: `UNAUTHORIZED` if no session.

---

### healthCheck

Called by `/api/health` route handler. Runs `SELECT 1` via Prisma.

**Input**: none

**Output**
```ts
{ success: true, data: { db: "ok" } }
| { success: false, error: "Database unavailable", code: "DB_UNREACHABLE" }
```

---

## Input Validation Rules (all actions)

| Rule | Detail |
|---|---|
| Session required | Every action calls `auth()` first; unauthenticated calls return `UNAUTHORIZED` |
| Zod schema | Every input object is parsed through a Zod schema before use |
| No raw `process.env` | Actions import typed constants from `lib/env.ts` only |
| No `any` types | Strict TypeScript; Prisma-generated types used throughout |

---

## Error Codes (foundation layer)

| Code | Meaning |
|---|---|
| `UNAUTHORIZED` | No valid session |
| `FORBIDDEN` | Session valid but insufficient access to the resource |
| `VALIDATION_ERROR` | Input failed Zod schema |
| `DB_UNREACHABLE` | Prisma cannot connect to PostgreSQL |
| `NOT_FOUND` | Requested entity does not exist |
