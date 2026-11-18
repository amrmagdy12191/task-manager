# Data Model: Foundation & Architecture

**Feature**: 001-foundation-architecture
**Date**: 2026-11-17

All tables are created in a single baseline Prisma migration (`0001_baseline`).
Auth.js-managed tables (`User`, `Account`, `Session`, `VerificationToken`) follow the
official `@auth/prisma-adapter` schema exactly and must not be modified manually.

---

## Auth.js-Managed Tables

### User
Managed by `@auth/prisma-adapter`. Extended with a one-to-one `Profile`.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String? | Display name from provider |
| email | String | Unique |
| emailVerified | DateTime? | |
| image | String? | Avatar URL |

### Account
OAuth/credential provider link. Managed by Auth.js.

### Session
Active session record. Managed by Auth.js.

### VerificationToken
Email verification token. Managed by Auth.js.

---

## Application Tables

### Profile
Extended user data beyond what Auth.js stores.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK → User.id (unique, 1-to-1) |
| displayName | String | Shown in UI; defaults to User.name |
| avatarInitials | String | Computed from displayName (2 chars) |
| passwordHash | String? | Bcrypt hash for the foundation Credentials provider; never selected by public profile queries or included in sessions |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### Project
A workspace grouping tasks. Any member has equal edit access (no RBAC).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | Required; max 100 chars |
| description | String? | Optional |
| ownerId | String | FK → User.id |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### ProjectMember
Many-to-many join: users ↔ projects. All members have equal edit access.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| projectId | String | FK → Project.id |
| userId | String | FK → User.id |
| joinedAt | DateTime | auto |

Unique constraint: `(projectId, userId)`

---

### Task
Core entity. Belongs to a project; optionally assigned to one project member.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| projectId | String | FK → Project.id |
| title | String | Required; max 200 chars |
| description | String? | Plain text or basic Markdown |
| status | TaskStatus (enum) | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| priority | Priority (enum) | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| dueDate | DateTime? | Null = no due date |
| assigneeId | String? | FK → User.id (must be a ProjectMember) |
| createdById | String | FK → User.id |
| position | Float | Ordering within status column (Kanban) |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

**State transitions**: Any member may move a task between any status values. No transition
restrictions in Phase 0.

**Overdue rule**: `dueDate < now() AND status ≠ DONE` → displayed with red due-date highlight (client-side).

---

### Comment
Text comment on a task. Supports `@mention` triggers for notifications.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| taskId | String | FK → Task.id |
| authorId | String | FK → User.id |
| body | String | Plain text; max 2000 chars |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### Notification
In-app notification record for assignment and @mention events.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| recipientId | String | FK → User.id |
| type | NotificationType (enum) | `TASK_ASSIGNED`, `MENTIONED` |
| taskId | String? | FK → Task.id (context link) |
| read | Boolean | Default false |
| createdAt | DateTime | auto |

---

### Tag
Plain text label attached to tasks within a project for categorisation.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | Required; max 50 chars |
| projectId | String | FK → Project.id (tags are project-scoped) |

Unique constraint: `(name, projectId)`

### TaskTag
Many-to-many join: tasks ↔ tags.

| Field | Type | Notes |
|---|---|---|
| taskId | String | FK → Task.id |
| tagId | String | FK → Tag.id |

Composite PK: `(taskId, tagId)`

---

## Enums

```
TaskStatus:  TODO | IN_PROGRESS | IN_REVIEW | DONE
Priority:    LOW | MEDIUM | HIGH | URGENT
NotificationType: TASK_ASSIGNED | MENTIONED
```

---

## Entity Relationships (summary)

```
User ─── 1:1 ──► Profile
User ─── 1:N ──► ProjectMember ◄─── N:1 ──► Project
Project ─── 1:N ──► Task
Task ─── 1:N ──► Comment
Task ─── M:N ──► Tag  (via TaskTag)
User ─── 1:N ──► Notification
```

---

## Access Control Rules (application layer)

All data access is enforced in Server Actions / Route Handlers before any Prisma query:

| Resource | Read | Write |
|---|---|---|
| Project | Members only | Members only |
| Task | Project members | Project members |
| Comment | Project members | Author only (edit/delete) |
| Notification | Recipient only | System-generated only |
| Tag | Project members | Project members |
| Profile | Authenticated user | Owner only |
