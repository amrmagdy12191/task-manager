# Data Model: Authentication and Profile

**Feature**: 002-auth-profile
**Date**: 2026-11-18

This phase adds a `password` field to the existing `User` table and fully populates
the `Profile` table introduced in the Phase 0 baseline migration. No new tables are
created (FR-011: feature phases MUST NOT introduce new base tables).

---

## Modified Table: User

The Phase 0 `User` model is extended with a hashed password field.

| Field | Type | Change | Notes |
|---|---|---|---|
| id | String (cuid) | Existing | PK |
| name | String? | Existing | Display name from Auth.js; superseded by Profile.displayName |
| email | String | Existing | Unique; validated as valid email format on sign-up |
| emailVerified | DateTime? | Existing | Auth.js managed |
| image | String? | Existing | Not used in Phase 1 |
| **password** | **String?** | **NEW** | bcrypt hash (cost 12); nullable for future OAuth accounts |

**Validation rules**:
- `email`: valid email format (Zod `z.string().email()`); unique constraint enforced by DB
- `password` (plain text input): minimum 8 characters validated before hashing; the stored
  value is always a bcrypt hash, never the raw password
- Duplicate email on sign-up → generic error returned (FR-104); no "email already exists"
  message exposed

**Migration**: `0002_auth_profile` — adds `password String?` column to `User`.

---

## Fully Populated Table: Profile

The Phase 0 `Profile` model is used for the first time in this phase.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK → User.id (unique, 1-to-1); cascade delete |
| displayName | String | Required; max 100 chars; defaults to sign-up `name`; user-editable |
| avatarInitials | String | 1–2 chars; defaults to first letters of display name words; user-editable |
| avatarColorIndex | Int | 0–7; maps to palette in `lib/avatar.ts`; auto-assigned on sign-up; user-editable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

**Validation rules**:
- `displayName`: required; max 100 characters; must not be empty string
- `avatarInitials`: 1–2 characters; trimmed; derived from `displayName` by default
- `avatarColorIndex`: integer 0–7 inclusive; assigned as `hash(email) % 8` on sign-up

**Avatar color palette** (index → hex, stored in `lib/avatar.ts`):

| Index | Color | Hex |
|---|---|---|
| 0 | Indigo | `#6366f1` |
| 1 | Violet | `#8b5cf6` |
| 2 | Pink | `#ec4899` |
| 3 | Amber | `#f59e0b` |
| 4 | Emerald | `#10b981` |
| 5 | Blue | `#3b82f6` |
| 6 | Red | `#ef4444` |
| 7 | Teal | `#14b8a6` |

All colors provide WCAG AA contrast with white initials text.

---

## Entity Relationships (this phase)

```
User ──── 1:1 ──── Profile
           │
           └── password: bcrypt hash (stored on User)
```

No new relationships introduced. The `User ↔ Profile` 1:1 relationship was defined in
the Phase 0 baseline migration.

---

## Session

Managed by Auth.js. No schema changes. The JWT token payload carries:
- `sub` → `user.id`
- `email`
- `name` (from User.name; UI uses Profile.displayName instead)

The protected layout fetches `Profile` from the database using `session.user.id` on
each request to get the current `displayName`, `avatarInitials`, and `avatarColorIndex`
for the header user menu.

---

## Access Control

| Resource | Read | Write |
|---|---|---|
| User.password | Never exposed | Only written on sign-up and password change (hashed) |
| Profile | Owner only | Owner only (via authenticated Server Actions) |

`requireUserId()` from `lib/db-middleware.ts` (Phase 0, T014b) MUST be called at the
start of every profile Server Action.
