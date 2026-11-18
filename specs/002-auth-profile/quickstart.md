# Quickstart Validation Guide: Authentication and Profile

**Feature**: 002-auth-profile
**Date**: 2026-11-18

Validates that Phase 1 auth and profile features work end-to-end. Assumes Phase 0 is
complete and the development server is running at `http://localhost:3000`.

---

## Prerequisites

- Phase 0 complete: `npm run db:migrate` applied, dev server starts, Phase 0 E2E tests pass
- `.env.local` populated (same variables as Phase 0; no new required variables for in-memory rate limiting)
- Demo mode requires no database. It persists changes in `.cache/demo-data.json`.
- The rate limiter is in-memory per server process. A shared production store is not
  configured; Upstash environment variables do not enable one. Trust forwarded IPs only
  behind a proxy that replaces untrusted headers (`TRUST_PROXY_HEADERS=true`).

---

## Setup (Phase 1 additions)

```bash
# Install new dependencies
npm install bcryptjs rate-limiter-flexible
# bcryptjs includes its own TypeScript declarations.

# PostgreSQL mode only: migrate existing hashes and add avatar colors
npm run db:migrate

# Start the development server (if not already running)
npm run dev
```

---

## Validation Scenarios

### Scenario 1 — Sign-up creates account and signs in (US1, FR-101–FR-105)

1. Navigate to `http://localhost:3000/sign-up` while signed out
2. Fill in: Name = "Test User", Email = `testuser@example.com`, Password = `password123`
3. Submit the form

**Expected**:
- Redirected to `http://localhost:3000/` (welcome card)
- Header shows "Test User" or avatar initials "TU"
- A profile exists in `.cache/demo-data.json` (demo) or the database (PostgreSQL)

---

### Scenario 2 — Duplicate email returns generic error (FR-104)

1. Attempt to sign up again with the same email `testuser@example.com`

**Expected**:
- Error message shown — does NOT say "email already registered" or similar
- Generic message such as "Please check your details and try again"
- No second `User` record created

---

### Scenario 3 — Invalid sign-up inputs show field errors (FR-102, FR-103)

1. Navigate to `/sign-up`
2. Submit with: Email = `notanemail`, Password = `short`

**Expected**:
- Field-level error on email: explains it must be a valid email address
- Field-level error on password: states the minimum length requirement (8 characters)
- No account created

---

### Scenario 4 — Sign-in and sign-out (US2, FR-106–FR-109)

1. Navigate to `/sign-in`
2. Sign in with `testuser@example.com` / `password123`

**Expected**: Redirected to `/`; header shows user name.

3. Click "Sign out" in the header user menu

**Expected**: Redirected to `/sign-in`; session cleared.

---

### Scenario 5 — Wrong credentials return generic error (FR-107)

1. Navigate to `/sign-in`
2. Enter `testuser@example.com` with password `wrongpassword`

**Expected**:
- Generic error: "Invalid email or password." — does NOT say "wrong password" or "email not found"

---

### Scenario 6 — Session persists across reload (FR-108)

1. Sign in
2. Reload the page

**Expected**: Still signed in; header still shows user name.

---

### Scenario 7 — Protected route redirect preserves return URL (FR-110)

1. Sign out
2. Navigate directly to `http://localhost:3000/profile`

**Expected**: Redirected to `/sign-in?callbackUrl=%2Fprofile`

3. Sign in

**Expected**: Redirected to `/profile` (not `/`)

---

### Scenario 8 — Authenticated user redirected from sign-in/sign-up (FR-111)

1. While signed in, navigate to `http://localhost:3000/sign-in`

**Expected**: Immediately redirected to `/`

2. Navigate to `http://localhost:3000/sign-up`

**Expected**: Immediately redirected to `/`

---

### Scenario 9 — Profile page shows current data (US3, FR-112)

1. Sign in as `testuser@example.com`
2. Navigate to `/profile`

**Expected**: Display name "Test User", avatar initials "TU", and a color swatch showing
the auto-assigned avatar color.

---

### Scenario 10 — Profile update reflects in header (FR-113–FR-115, SC-104)

1. On the profile page, change display name to "Alice"
2. Change avatar color to a different color
3. Save changes

**Expected**:
- Success confirmation shown
- Header user menu shows "Alice" and the new avatar color within 2 seconds (no full page reload)

---

### Scenario 11 — Empty display name rejected (FR-113)

1. On the profile page, clear the display name field and attempt to save

**Expected**: Field-level validation error; save does not proceed.

---

### Scenario 12 — Password change (US4, FR-116)

1. On the profile page, navigate to the password change section
2. Enter current password `password123`, new password `newpassword456`, confirm `newpassword456`
3. Save

**Expected**: Success message; session remains active.

4. Sign out and sign in with `newpassword456`

**Expected**: Sign-in succeeds.

5. Try signing in with old password `password123`

**Expected**: Sign-in fails with generic error.

---

### Scenario 13 — Wrong current password rejected (FR-116)

1. On the profile page, enter `wrongcurrentpassword` as the current password
2. Enter a valid new password and confirmation

**Expected**: Error: "Current password is incorrect." Save does not proceed.

---

### Scenario 14 — Rate limiting on sign-in (FR-119)

1. Submit 11 sign-in attempts with wrong credentials in rapid succession (use a script
   or browser dev tools to repeat the request)

**Expected**:
- Attempts 1–10: Normal "Invalid email or password." response
- Attempt 11+: "Too many sign-in attempts. Please wait a minute before trying again."

---

### Scenario 15 — Keyboard navigation (SC-106)

1. Navigate to `/sign-up` using keyboard only (Tab to reach the page link, Enter to open)
2. Tab through all form fields; confirm each has a visible focus ring
3. Complete the form using keyboard only (no mouse)

**Expected**: All fields reachable; form submittable with Enter; no keyboard trap.

---

### Scenario 16 — E2E test suite

```bash
npx playwright test tests/e2e/auth.spec.ts tests/e2e/profile.spec.ts
```

**Expected**: All tests pass.

---

## References

- Data model: [data-model.md](./data-model.md)
- Auth endpoint contracts: [contracts/auth-endpoints.md](./contracts/auth-endpoints.md)
- Server action contracts: [contracts/server-actions.md](./contracts/server-actions.md)
- Spec: [spec.md](./spec.md)
- Phase 0 quickstart: [../001-foundation-architecture/quickstart.md](../001-foundation-architecture/quickstart.md)

## Implementation validation — 2026-11-18

All scenarios below passed in real Chromium against an isolated production build on
`http://localhost:3010`. The interactive browser host was unavailable, so T133 used
automated interactions plus manual review of screenshots instead of a mouse-driven
walkthrough on port 3000. The regular development server remains on port 3000.
This keeps test registrations and password changes out of the user's demo data.

| Scenarios | Evidence | Result |
|---|---|---|
| 1–3: registration, duplicate, invalid fields | `sign-up.spec.ts`; demo write and PostgreSQL transaction tests | PASS |
| 4–6: sign-in/out, generic failure, reload | `sign-in.spec.ts`, `auth.spec.ts` | PASS |
| 7–8: protected return URL and authenticated redirects | `profile.spec.ts`, `auth.spec.ts` | PASS |
| 9–11: current profile, header refresh within 2s, required name | `profile.spec.ts` | PASS |
| 12–13: password change, old-password rejection, wrong current password | `profile.spec.ts` | PASS |
| 14: ten attempts allowed, eleventh rate-limited | `sign-in.spec.ts`, `rate-limit.test.ts` | PASS |
| 15: keyboard-only sign-up and menu controls | `sign-up.spec.ts`, `user-menu.spec.ts`, `UserMenu.test.tsx` | PASS |
| 16: complete browser suite | 29 tests passing, none skipped | PASS |

Additional validation: 74 unit/component tests, 6 local PostgreSQL integration tests,
strict TypeScript, ESLint, and production build passed. Light/dark screenshots of both
new pages were reviewed at 375px and 1280px; no clipping or horizontal overflow found.
Screenshots are in the ignored `test-results/connectivity-*/` directories.

Regression cases also cover failed network requests with retry, cross-tab sign-out
followed by a stale form submission, concurrent duplicate registrations, database
transaction rollback, and stale password replacement. Credential response checks
and explicit query selection found no public password/hash exposure.
