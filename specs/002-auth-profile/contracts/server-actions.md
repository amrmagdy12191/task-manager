# Contract: Server Actions — Phase 1

**Feature**: 002-auth-profile
**Date**: 2026-11-18

All actions follow the `ActionResult<T>` contract established in Phase 0. Every action
that accesses user data MUST call `requireUserId(session.user.id)` before any Prisma query.

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }
```

---

## signUpAction

**File**: `lib/actions/auth.ts`
**Auth required**: No (public)

**Input**:
```ts
{ name: string; email: string; password: string }
```

**Output**:
```ts
ActionResult<{ userId: string }>
```

**Side effects**: Creates `User` + `Profile` rows; calls `signIn`; redirects to `/`.

**Error codes**:
| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Zod schema failure (field-level) |
| `SIGN_UP_FAILED` | Duplicate email or unexpected DB error (generic message) |

---

## updateProfileAction

**File**: `lib/actions/profile.ts`
**Auth required**: Yes

**Input**:
```ts
{
  displayName: string,       // required; 1–100 chars
  avatarInitials: string,    // required; 1–2 chars
  avatarColorIndex: number,  // required; 0–7 inclusive
}
```

**Output**:
```ts
ActionResult<{
  displayName: string;
  avatarInitials: string;
  avatarColorIndex: number;
}>
```

**Side effects**: Updates `Profile` row for `session.user.id`; caller invokes
`router.refresh()` to re-render the header.

**Error codes**:
| Code | Meaning |
|---|---|
| `UNAUTHORIZED` | No valid session |
| `VALIDATION_ERROR` | Empty display name, invalid initials, or out-of-range color index |
| `NOT_FOUND` | Profile record missing (should not occur after sign-up) |

---

## changePasswordAction

**File**: `lib/actions/profile.ts`
**Auth required**: Yes

**Input**:
```ts
{
  currentPassword: string,   // required; verified with bcrypt.compare
  newPassword: string,       // required; min 8 chars
  confirmPassword: string,   // must equal newPassword (client + server validated)
}
```

**Output**:
```ts
ActionResult<{ success: true }>
```

**Side effects**: Updates `User.password` with new bcrypt hash (cost 12). Session
remains active.

**Error codes**:
| Code | Meaning |
|---|---|
| `UNAUTHORIZED` | No valid session |
| `VALIDATION_ERROR` | New password too short or confirmation mismatch |
| `WRONG_PASSWORD` | Current password does not match stored hash |

---

## getProfileAction

**File**: `lib/actions/profile.ts`
**Auth required**: Yes

**Input**: none (reads from session)

**Output**:
```ts
ActionResult<{
  displayName: string;
  avatarInitials: string;
  avatarColorIndex: number;
  email: string;
}>
```

Used by the profile page to populate the edit form with current values.

---

## Error Codes (this phase)

| Code | Meaning |
|---|---|
| `UNAUTHORIZED` | No valid session |
| `VALIDATION_ERROR` | Input failed Zod schema |
| `SIGN_UP_FAILED` | Sign-up failed (generic; covers duplicate email) |
| `WRONG_PASSWORD` | Current password verification failed |
| `RATE_LIMITED` | Too many sign-in attempts from this IP |
| `NOT_FOUND` | Requested entity does not exist |
| `DB_ERROR` | Unexpected Prisma error |
