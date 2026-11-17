# Quickstart Validation Guide: Foundation & Architecture

**Feature**: 001-foundation-architecture
**Date**: 2026-11-17

This guide validates that the Phase 0 foundation is working end-to-end.
It is not an implementation guide — see [plan.md](./plan.md) and [tasks.md](./tasks.md)
for implementation steps.

---

## Prerequisites

- Node.js LTS (v22+) installed
- PostgreSQL 15+ running locally (or a hosted instance)
- A `.env.local` file created from `.env.local.example` with all required variables set

**Required environment variables** (defined in `lib/env.ts`):
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<random 32-char string>
NEXTAUTH_URL=http://localhost:3000
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Apply database migrations (creates all 7 tables + Auth.js tables)
npm run db:migrate

# Set SEED_EMAIL, SEED_PASSWORD, and SEED_NAME in .env.local, then create a local account
npm run db:seed

# 3. Start the development server
npm run dev
```

Expected: server starts at `http://localhost:3000` with no console errors.

---

## Validation Scenarios

### Scenario 1 — Missing environment variable error (FR-004)

1. Remove `NEXTAUTH_SECRET` from `.env.local`
2. Run `npm run dev`

**Expected**: The application throws a startup error listing `NEXTAUTH_SECRET` as missing.
It does NOT start silently with an undefined value.

---

### Scenario 2 — Unauthenticated redirect (FR-005, SC-003)

1. Ensure you are signed out (or open a private window)
2. Navigate to `http://localhost:3000` (the protected home route)

**Expected**: Browser immediately redirects to `/sign-in?callbackUrl=%2F`.
No home screen content is visible before the redirect.

---

### Scenario 3 — Sign in and welcome card (User Story 1)

1. Navigate to `http://localhost:3000/sign-in`
2. Enter valid credentials and submit

**Expected**:
- Redirected to `http://localhost:3000` (or the original `callbackUrl`)
- A welcome card is displayed showing the signed-in user's display name
- A green (or neutral) "Connected" status indicator is visible

---

### Scenario 4 — Authenticated user cannot re-visit sign-in (FR-006)

1. While signed in, navigate directly to `http://localhost:3000/sign-in`

**Expected**: Immediately redirected to `http://localhost:3000` (app root). Sign-in form
is never shown to an already-authenticated user.

---

### Scenario 5 — Idempotent migration (User Story 3, SC-004)

1. With migrations already applied, run `npm run db:migrate` again

**Expected**: Command completes with "No pending migrations" or equivalent. Zero errors.
No tables are dropped or recreated.

Verify tables exist:
```bash
npm run db:studio
# Confirm visible models: User, Account, Session, VerificationToken,
# Profile, Project, ProjectMember, Task, Comment, Notification, Tag, TaskTag
```

---

### Scenario 6 — Connectivity banner (FR-010)

1. Stop the PostgreSQL server (or set `DATABASE_URL` to a non-existent host)
2. Reload the app while signed in

**Expected**:
- A dismissible banner appears at the top of the page warning of a connectivity issue
- A "Retry" button is visible
- Navigation is NOT blocked — you can still move between pages
- Clicking "Retry" re-checks the connection

---

### Scenario 7 — TypeScript compilation (FR-008, SC-005)

```bash
npx tsc --noEmit
```

**Expected**: Zero errors. Zero `@ts-ignore` or `any` suppressions in foundation files.

---

### Scenario 8 — E2E auth flow (Playwright)

```bash
npx playwright test tests/e2e/auth.spec.ts
```

**Expected**: All tests pass, covering:
- Unauthenticated redirect to sign-in
- Successful sign-in lands on correct page
- Signed-in user redirected away from sign-in page
- Sign-out clears session and redirects to sign-in

---

## References

- Data model: [data-model.md](./data-model.md)
- Auth endpoint contracts: [contracts/auth-endpoints.md](./contracts/auth-endpoints.md)
- Server action contracts: [contracts/server-actions.md](./contracts/server-actions.md)
- Spec: [spec.md](./spec.md)
