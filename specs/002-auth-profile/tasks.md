# Tasks: Authentication and Profile

**Input**: Design documents from `specs/002-auth-profile/`
**Branch**: `002-auth-profile`
**Date**: 2026-11-18

**Prerequisites**: Phase 0 (`001-foundation-architecture`) fully implemented.
All Phase 0 tasks (T001–T041) must be complete before starting this phase.
The following already exist: `lib/auth.ts`, `lib/db.ts`, `lib/db-middleware.ts`,
`lib/actions/auth.ts` (signOutAction), `middleware.ts`, `app/(auth)/sign-in/`,
`app/(protected)/layout.tsx`, `app/(protected)/page.tsx`.

**Spec**: `specs/002-auth-profile/spec.md`
**Data model**: `specs/002-auth-profile/data-model.md`
**Contracts**: `specs/002-auth-profile/contracts/`
**Research**: `specs/002-auth-profile/research.md`

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (operates on different files, no dependency on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Include exact file paths in all descriptions

---

## Phase 1: Setup (New Dependencies)

**Purpose**: Install new packages and apply the Phase 1 migration.

- [X] T101 Install `bcryptjs` and `rate-limiter-flexible` by running `npm install bcryptjs rate-limiter-flexible` and install the TypeScript type declaration for bcryptjs by running `npm install -D @types/bcryptjs`; confirm both packages appear in `package.json` dependencies

- [X] T102 Add Prisma migration `0002_auth_profile` by running `npx prisma migrate dev --name auth_profile`; this migration adds a nullable `password String?` column to the `User` table; confirm `prisma/migrations/` contains the new migration directory and `npx prisma generate` succeeds

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core library files that every user story depends on. No user story work
can begin until this phase is complete.

**⚠️ CRITICAL**: Complete T103–T109b before any Phase 3–7 task.

- [X] T103 Create `lib/avatar.ts` — export `AVATAR_PALETTE` (a `readonly` array of exactly 8 hex color strings in this order: `['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']`), export `getAvatarColor(index: number): string` (returns `AVATAR_PALETTE[index % 8]`), export `assignAvatarColor(email: string): number` (converts the email string to a numeric hash using a simple djb2-style loop then returns `hash % 8` as the color index), export `deriveInitials(displayName: string): string` (splits the display name by whitespace, takes the first character of each word uppercased, returns the first 2 characters or 1 if only one word). All four exports must be typed with `string` / `number` — no `any`. File: `lib/avatar.ts`

- [X] T104 Create `lib/rate-limit.ts` — import `RateLimiterMemory` from `rate-limiter-flexible`; create and export a singleton `rateLimiter` instance: `new RateLimiterMemory({ points: 10, duration: 60 })` (10 sign-in attempts per 60-second window); export `async function checkRateLimit(ip: string): Promise<void>` that calls `rateLimiter.consume(ip)` and throws an `Error` with message `'RATE_LIMITED'` if `RateLimiterRes` is thrown (i.e., wrap the consume call in try/catch — if the caught error has a `msBeforeNext` property it is a rate limit error, rethrow as `new Error('RATE_LIMITED')`). File: `lib/rate-limit.ts`

- [X] T105 Update `lib/auth.ts` — replace the placeholder `authorize()` function body with real bcrypt authentication: (1) import `bcryptjs` with `import bcrypt from 'bcryptjs'`; (2) import `checkRateLimit` from `'@/lib/rate-limit'`; (3) inside `authorize(credentials)`: call `await checkRateLimit(req?.headers?.get?.('x-forwarded-for') ?? '127.0.0.1')` — if it throws `RATE_LIMITED` throw a `new CredentialsSignin('RATE_LIMITED')` error; (4) look up `await db.user.findUnique({ where: { email: credentials.email as string } })`; (5) if no user or `!user.password` return `null`; (6) compare with `await bcrypt.compare(credentials.password as string, user.password)` — if false return `null`; (7) return `{ id: user.id, email: user.email, name: user.name ?? '' }`. Existing imports and the rest of `lib/auth.ts` remain unchanged. File: `lib/auth.ts`

- [X] T106 Create `lib/actions/profile.ts` — `'use server'`; import `{ auth }` from `'@/lib/auth'`, `{ db }` from `'@/lib/db'`, `{ requireUserId }` from `'@/lib/db-middleware'`, `{ z }` from `'zod'`, `bcrypt` from `'bcryptjs'`; define and export three async Server Actions:

  **(A) `getProfileAction()`** — calls `auth()`, calls `requireUserId(session?.user?.id)`, queries `db.profile.findUniqueOrThrow({ where: { userId: session.user.id }, select: { displayName:true, avatarInitials:true, avatarColorIndex:true } })` and also fetches `email` from `db.user.findUniqueOrThrow({ where:{ id: session.user.id }, select:{ email:true } })`, returns `{ success: true, data: { displayName, avatarInitials, avatarColorIndex, email } }` or `{ success: false, error: string, code: string }` on any error.

  **(B) `updateProfileAction(input: unknown)`** — Zod schema: `z.object({ displayName: z.string().min(1).max(100), avatarInitials: z.string().min(1).max(2).trim(), avatarColorIndex: z.number().int().min(0).max(7) })`; on validation failure return `{ success:false, error:'Validation failed', code:'VALIDATION_ERROR' }`; calls `auth()`, `requireUserId`, updates `db.profile.update({ where:{ userId: session.user.id }, data: parsed })`, returns `{ success:true, data: updated }`.

  **(C) `changePasswordAction(input: unknown)`** — Zod schema: `z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8), confirmPassword: z.string() }).refine(d => d.newPassword === d.confirmPassword, { message:'Passwords do not match', path:['confirmPassword'] })`; calls `auth()`, `requireUserId`; fetches `db.user.findUniqueOrThrow({ where:{ id: session.user.id }, select:{ password:true } })`; if `!user.password || !(await bcrypt.compare(parsed.currentPassword, user.password))` return `{ success:false, error:'Current password is incorrect', code:'WRONG_PASSWORD' }`; hash new password with `await bcrypt.hash(parsed.newPassword, 12)`; updates `db.user.update({ where:{ id: session.user.id }, data:{ password: hashed } })`; returns `{ success:true, data:{ success:true } }`.

  File: `lib/actions/profile.ts`

- [X] T106b Add `signUpAction` to `lib/actions/auth.ts` (the existing file that already contains `signOutAction`) — append to the bottom of the file (after the existing signOutAction export); add imports at top if not already present: `{ db }` from `'@/lib/db'`, `{ z }` from `'zod'`, `bcrypt` from `'bcryptjs'`, `{ assignAvatarColor, deriveInitials }` from `'@/lib/avatar'`, `{ signIn }` from `'@/lib/auth'`, `{ redirect }` from `'next/navigation'`; implement `signUpAction(input: unknown)`: Zod schema: `z.object({ name: z.string().min(1).max(100), email: z.string().email(), password: z.string().min(8) })`; on validation failure return `{ success:false, error:'Please check your details and try again.', code:'VALIDATION_ERROR' }`; check for existing user via `db.user.findUnique({ where:{ email: parsed.email }, select:{ id:true } })`; if found return `{ success:false, error:'Please check your details and try again.', code:'SIGN_UP_FAILED' }` (DO NOT reveal the email exists — same generic message for both duplicate-email and validation errors); hash password with `await bcrypt.hash(parsed.password, 12)`; compute `colorIndex = assignAvatarColor(parsed.email)`; compute `initials = deriveInitials(parsed.name)`; run a Prisma interactive transaction: `const [newUser] = await db.$transaction(async (tx) => { const u = await tx.user.create({ data:{ name: parsed.name, email: parsed.email, password: hashed } }); await tx.profile.create({ data:{ userId: u.id, displayName: parsed.name, avatarInitials: initials, avatarColorIndex: colorIndex } }); return [u]; })`; after the transaction call `await signIn('credentials', { email: parsed.email, password: parsed.password, redirect: false })`; then call `redirect('/')`; wrap entire action in try/catch — any unexpected error (that is not a redirect) returns `{ success:false, error:'Something went wrong. Please try again.', code:'DB_ERROR' }`. File: `lib/actions/auth.ts`

- [X] T107 Extend `middleware.ts` — in the `isAuthRoute` check, add `/sign-up` alongside `/sign-in` so that authenticated users visiting `/sign-up` are also redirected to `/`. Current line reads: `const isAuthRoute = nextUrl.pathname.startsWith('/sign-in')` — change to: `const isAuthRoute = nextUrl.pathname.startsWith('/sign-in') || nextUrl.pathname.startsWith('/sign-up')`. No other changes to `middleware.ts`. File: `middleware.ts`

- [X] T108 Create `components/ui/AvatarBadge.tsx` — a React Server Component (no `'use client'`); props: `interface AvatarBadgeProps { initials: string; colorHex: string; size?: 'sm' | 'md' | 'lg' }`; size maps to Tailwind classes: `sm = 'w-7 h-7 text-xs'`, `md = 'w-9 h-9 text-sm'` (default), `lg = 'w-12 h-12 text-base'`; renders a `<span>` with `style={{ backgroundColor: colorHex }}` and Tailwind classes `rounded-full flex items-center justify-center font-semibold text-white select-none uppercase`; displays `initials.slice(0,2)`; exports as default. File: `components/ui/AvatarBadge.tsx`

- [X] T109 Write Vitest unit tests for `lib/avatar.ts` — create `__tests__/lib/avatar.test.ts`; test `assignAvatarColor`: same email always returns same index (0–7); different emails can return different indices; test `deriveInitials`: `'Alice Bob'` → `'AB'`; `'Charlie'` → `'C'`; `'Alice Bob Carol'` → `'AB'` (max 2 chars); test `getAvatarColor`: returns a string starting with `'#'`; run with `npm test` to confirm all pass. File: `__tests__/lib/avatar.test.ts`

**Checkpoint**: Foundation ready. T103–T109 complete → all user story phases can proceed.

---

## Phase 3: US1 — Sign-Up (Priority: P1) 🎯 MVP

**Goal**: A new visitor can create an account with name, email, and password, then land on
the welcome card at `/`.

**Independent test**: Navigate to `/sign-up` while signed out → fill form → submit →
land on `/` with the new user's name visible in the header. Check DB for `User` and
`Profile` rows.

- [X] T110 Write Playwright E2E test for the sign-up flow — create `tests/e2e/sign-up.spec.ts`; test 1: visits `/sign-up`, fills `name='E2E User'`, `email='e2e@test.com'`, `password='password123'`, submits, asserts redirect to `/`, asserts page contains the user's display name or initials; test 2: submits with an invalid email `'notanemail'`, asserts a field-level error is visible without navigation; test 3: submits with `password='short'` (< 8 chars), asserts a password length error; test 4: submits the same email twice, asserts a generic error on the second attempt that does NOT contain the word "exists" or "registered". Run with `npx playwright test tests/e2e/sign-up.spec.ts` — tests should currently fail (no `/sign-up` page yet). File: `tests/e2e/sign-up.spec.ts`

- [X] T111 [US1] Create `app/(auth)/sign-up/page.tsx` — a Next.js page component (Server Component); imports and renders `<SignUpForm />` centered on the page with the same layout pattern as `app/(auth)/sign-in/page.tsx`; includes a link to `/sign-in` ("Already have an account? Sign in"); page title metadata: `Sign Up | TaskFlow`. File: `app/(auth)/sign-up/page.tsx`

- [X] T112 [US1] Create `components/ui/SignUpForm.tsx` — `'use client'`; a form with controlled inputs for `name` (text, required, maxLength=100), `email` (email, required), `password` (password, required, minLength=8); uses `React.useActionState` (or `useFormState` in React 18) with `signUpAction` from `'@/lib/actions/auth'`; on action result with `success:false` display the `result.error` string in a red error `<p>`; show field-specific Zod errors if `code==='VALIDATION_ERROR'` and the error message names the field; submit button shows "Creating account…" while pending (use `useFormStatus`); all inputs have associated `<label>` elements with matching `htmlFor`/`id`; button is `type='submit'`. File: `components/ui/SignUpForm.tsx`

- [X] T113 [US1] Verify the sign-up E2E tests from T110 pass by running `npx playwright test tests/e2e/sign-up.spec.ts`; fix any issues found before moving on.

**Checkpoint**: US1 complete — sign-up creates account, signs in, redirects to `/`.

---

## Phase 4: US2 — Sign-In / Sign-Out (Priority: P1)

**Goal**: An existing user can sign in with email + password, session persists across
reloads, and they can sign out from the header.

**Independent test**: Sign in at `/sign-in` → reload → still signed in → click sign out →
redirected to `/sign-in`.

- [X] T114 Write Playwright E2E tests for sign-in and sign-out — create `tests/e2e/sign-in.spec.ts`; test 1: visits `/sign-in`, signs in with valid credentials (use a seeded test user or sign up first), asserts redirect to `/`; test 2: submits wrong password, asserts error message "Invalid email or password." appears and does NOT contain "wrong" or "not found"; test 3: after sign-in, reloads page, asserts still signed in (user name visible); test 4: signs in then clicks "Sign out" in the header, asserts redirect to `/sign-in`. Run with `npx playwright test tests/e2e/sign-in.spec.ts`. File: `tests/e2e/sign-in.spec.ts`

- [X] T115 [US2] Update `components/ui/SignInForm.tsx` — add handling for the `RATE_LIMITED` error code: when `signIn` returns `{ error: 'CredentialsSignin' }` show "Invalid email or password." as before; when the error message is `'RATE_LIMITED'` (check `error?.message === 'RATE_LIMITED'`) show "Too many sign-in attempts. Please wait a minute before trying again." in a red `<p>`; no other changes to this file. File: `components/ui/SignInForm.tsx`

- [X] T116 [US2] Create `components/ui/UserMenu.tsx` — `'use client'`; props: `interface UserMenuProps { displayName: string; avatarInitials: string; avatarColorHex: string }`; renders a `<div>` containing an `<AvatarBadge>` button that toggles an open/closed dropdown state (use `useState`); when open, renders an absolutely-positioned dropdown with two items: a "Profile" `<Link href='/profile'>` and a sign-out button that calls `signOutAction` from `'@/lib/actions/auth'` using a `<form action={signOutAction}>`; closes dropdown on outside click (use a `useEffect` with a `mousedown` listener on `document`); dropdown has `role='menu'`, items have `role='menuitem'`; Tailwind-only styling; size prop `'sm'` passed to `AvatarBadge`. File: `components/ui/UserMenu.tsx`

- [X] T117 [US2] Update `app/(protected)/layout.tsx` — import `{ auth }` from `'@/lib/auth'`, `{ db }` from `'@/lib/db'`, `{ getAvatarColor }` from `'@/lib/avatar'`, and `UserMenu` from `'@/components/ui/UserMenu'`; inside the layout Server Component function: call `const session = await auth()`; query `const profile = await db.profile.findUnique({ where: { userId: session!.user!.id }, select: { displayName:true, avatarInitials:true, avatarColorIndex:true } })`; derive `const colorHex = getAvatarColor(profile?.avatarColorIndex ?? 0)`; add a `<header>` element at the top of the layout with a `<UserMenu>` component passing `displayName={profile?.displayName ?? session!.user!.name ?? ''}`, `avatarInitials={profile?.avatarInitials ?? '?'}`, `avatarColorHex={colorHex}`; existing layout children `{children}` remain unchanged. File: `app/(protected)/layout.tsx`

- [X] T118 [US2] Verify the sign-in and sign-out E2E tests from T114 pass by running `npx playwright test tests/e2e/sign-in.spec.ts`; fix any issues.

**Checkpoint**: US2 complete — sign-in, session persistence, and sign-out all work.

---

## Phase 5: US3 — Profile View & Edit (Priority: P2)

**Goal**: A signed-in user can view and update their display name, avatar initials, and
avatar color from `/profile`.

**Independent test**: Sign in → navigate to `/profile` → see current name and color →
change display name to "Alice" and select a different color → save → header shows "Alice"
with the new color within 2 seconds.

- [X] T119 Write Playwright E2E tests for profile editing — create `tests/e2e/profile.spec.ts`; test 1: signs in, navigates to `/profile`, asserts display name input is pre-populated; test 2: changes display name to "Updated Name", saves, asserts success feedback shown and header updates to "Updated Name"; test 3: clears display name and saves, asserts a field-level validation error (do not navigate away); test 4: navigates to `/profile` while signed out (via direct URL), asserts redirect to `/sign-in?callbackUrl=%2Fprofile`. Run with `npx playwright test tests/e2e/profile.spec.ts`. File: `tests/e2e/profile.spec.ts`

- [X] T120 [US3] Create `components/ui/ProfileForm.tsx` — `'use client'`; props: `interface ProfileFormProps { initialDisplayName: string; initialAvatarInitials: string; initialAvatarColorIndex: number }`; uses `React.useActionState` with `updateProfileAction` from `'@/lib/actions/profile'`; controlled inputs: `displayName` (text, required, maxLength=100), `avatarInitials` (text, required, maxLength=2, pattern=`.{1,2}`); a color picker rendered as 8 clickable `<button type='button'>` swatches — each swatch is a `<span>` with `style={{ backgroundColor: AVATAR_PALETTE[i] }}` from `'@/lib/avatar'` and a checkmark icon when selected (use `state === i ? '✓' : ''`); selected color index stored in component state and included in form via a hidden `<input type='hidden' name='avatarColorIndex' value={selectedColorIndex} />`; on `result.success` call `router.refresh()` from `useRouter()` to update the header; on `result.success` show a green "Changes saved." message for 3 seconds then clear it; on `result.success === false` show `result.error` in red; submit button shows "Saving…" while pending. File: `components/ui/ProfileForm.tsx`

- [X] T121 [US3] Create `app/(protected)/profile/page.tsx` — Next.js page (Server Component); calls `const session = await auth()`, queries `const profile = await db.profile.findUniqueOrThrow({ where:{ userId: session!.user!.id } })`, queries `const user = await db.user.findUniqueOrThrow({ where:{ id: session!.user!.id }, select:{ email:true } })`; renders a page with two sections: (1) a `<ProfileForm>` component with the current profile values; (2) a `<PasswordChangeForm>` component (created in T124); shows the user's email as read-only text above the form (not editable — email changes are out of scope); page title metadata: `Profile | TaskFlow`. File: `app/(protected)/profile/page.tsx`

- [X] T122 [US3] Verify the profile E2E tests from T119 pass by running `npx playwright test tests/e2e/profile.spec.ts`; fix any issues.

**Checkpoint**: US3 complete — profile view and edit work; header updates after save.

---

## Phase 6: US4 — Password Change (Priority: P3)

**Goal**: A signed-in user can change their password from the profile page by supplying
the current password, a new password, and confirmation.

**Independent test**: Sign in → go to `/profile` → enter current password and a new
password → save → sign out → sign back in with the new password → succeeds.

- [X] T123 Write Playwright E2E tests for password change — append to `tests/e2e/profile.spec.ts`; test 5: on the profile page enters `currentPassword='password123'`, `newPassword='newpass456'`, `confirmPassword='newpass456'`, submits, asserts success message, signs out, signs back in with `'newpass456'` and asserts success; test 6: enters wrong `currentPassword='wrongpassword'`, submits, asserts error "Current password is incorrect." appears without page navigation; test 7: enters `newPassword='short'` (< 8 chars), asserts validation error. Run `npx playwright test tests/e2e/profile.spec.ts`. File: `tests/e2e/profile.spec.ts`

- [X] T124 [US4] Create `components/ui/PasswordChangeForm.tsx` — `'use client'`; uses `React.useActionState` with `changePasswordAction` from `'@/lib/actions/profile'`; three password inputs: `currentPassword` (required), `newPassword` (required, minLength=8), `confirmPassword` (required); client-side: check `newPassword === confirmPassword` on submit before calling action — if mismatch show "Passwords do not match." inline and do not submit; on `result.success` show "Password updated." in green for 3 seconds then clear all three fields; on `result.success===false && result.code==='WRONG_PASSWORD'` show "Current password is incorrect." in red next to the current-password field; on `result.code==='VALIDATION_ERROR'` show the validation message; each input has a matching `<label>`; submit button text "Update password" / "Updating…" while pending. File: `components/ui/PasswordChangeForm.tsx`

- [X] T125 [US4] Verify the password change E2E tests from T123 pass by running `npx playwright test tests/e2e/profile.spec.ts`; fix any issues.

**Checkpoint**: US4 complete — password change works; old password no longer accepted.

---

## Phase 7: US5 — Header User Menu (Priority: P2)

**Goal**: The header user menu (built in T116–T117) shows the correct display name and
avatar, links to `/profile`, and contains a working sign-out button.

**Note**: The `UserMenu` component and layout integration were created in Phase 4 (T116,
T117). This phase validates the full US5 acceptance criteria.

**Independent test**: Sign in → header shows avatar badge with correct initials and color →
click badge → dropdown opens with "Profile" link and "Sign out" button → click "Profile"
→ lands on `/profile` → click "Sign out" → redirected to `/sign-in`.

- [X] T126 Write Vitest unit tests for `UserMenu` — create `__tests__/components/ui/UserMenu.test.tsx`; using `@testing-library/react`: test 1: renders without crashing with valid props; test 2: clicking the avatar button toggles the dropdown visibility (look for `role='menu'`); test 3: "Profile" link has `href='/profile'`; test 4: dropdown closes when clicking outside the component (simulate a `mousedown` on `document.body`). Run with `npm test`. File: `__tests__/components/ui/UserMenu.test.tsx`

- [X] T127 [US5] [P] Write Playwright E2E tests for the header user menu — create `tests/e2e/user-menu.spec.ts`; test 1: signs in, asserts `<header>` is present in the DOM; test 2: clicks the avatar badge, asserts dropdown menu becomes visible with "Profile" and "Sign out" items; test 3: clicks "Profile" in the dropdown, asserts URL becomes `/profile`; test 4: opens the dropdown and clicks "Sign out", asserts redirect to `/sign-in`. Run with `npx playwright test tests/e2e/user-menu.spec.ts`. File: `tests/e2e/user-menu.spec.ts`

- [X] T128 [US5] Verify all US5 E2E tests pass by running `npx playwright test tests/e2e/user-menu.spec.ts`; fix any issues.

**Checkpoint**: US5 complete — header user menu works across all scenarios.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Rate limiting validation, full type-check, complete test suite.

- [X] T129 [P] Write a Vitest unit test for `lib/rate-limit.ts` — create `__tests__/lib/rate-limit.test.ts`; test 1: calling `checkRateLimit('test-ip')` 10 times in a loop resolves without throwing; test 2: calling it an 11th time within the same limiter instance throws an error with message `'RATE_LIMITED'`; because the singleton would retain state across tests, instantiate a fresh `RateLimiterMemory({ points: 10, duration: 60 })` and a matching `checkRateLimit`-style function locally inside the test rather than importing the singleton directly. Run with `npm test`. File: `__tests__/lib/rate-limit.test.ts`

- [X] T130 [P] Write a Vitest unit test for `lib/avatar.ts` `deriveInitials` edge cases — append to `__tests__/lib/avatar.test.ts` (created in T109): test `deriveInitials('  Alice  ')` (extra whitespace) → `'A'`; test `deriveInitials('a b c d')` → `'AB'`; test `deriveInitials('')` → `''`; run `npm test` and confirm all pass. File: `__tests__/lib/avatar.test.ts`

- [X] T130b [P] Audit all Prisma queries for accidental `password` field exposure (FR-118) — run `grep -rn "db\.user\." lib/ app/` and inspect every result; for each `findUnique`, `findUniqueOrThrow`, `findFirst`, `findMany`, or `update` on the `User` model, confirm an explicit `select` is present that does NOT include `password`; if any query omits `select` entirely (which would return all fields including `password`), add the missing `select` clause; document the grep output in a code comment above the offending query. This task covers FR-118: "Passwords MUST NOT appear in any server response." File: any `lib/` or `app/` file containing a bare `db.user` query.

- [X] T131 Run `npx tsc --noEmit` from the project root and fix every TypeScript error. No `any` suppressions allowed — if a type is unknown, use `unknown` with a narrowing check. All errors must be resolved before marking this task done.

- [X] T132 Run the full test suite with `npm test` (Vitest) and `npx playwright test` (Playwright); all tests must pass. Fix any failures. If a test is flaky (fails intermittently), investigate and fix the root cause — do not add `test.skip`.

- [X] T133 Validate end-to-end using the scenarios in `specs/002-auth-profile/quickstart.md` — manually run Scenarios 1–16 against `http://localhost:3000` (`npm run dev`); check off each scenario; document any scenario that fails and fix it.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (T101–T102)**: No dependencies — start immediately
- **Phase 2 (T103–T109)**: Depends on Phase 1 — BLOCKS all user story phases
- **Phase 3 (T110–T113)**: Depends on Phase 2
- **Phase 4 (T114–T118)**: Depends on Phase 2; can run in parallel with Phase 3
- **Phase 5 (T119–T122)**: Depends on Phase 2 + T116–T117 (from Phase 4)
- **Phase 6 (T123–T125)**: Depends on Phase 5 (profile page must exist)
- **Phase 7 (T126–T128)**: Depends on Phase 4 (UserMenu must exist)
- **Phase 8 (T129–T133)**: Depends on all previous phases

### Within Phase 2 (Foundational)

```
T103 (lib/avatar.ts)
T104 (lib/rate-limit.ts)   ← T103 must exist first (rate-limit is standalone)
T105 (lib/auth.ts)         ← needs T104
T106 (lib/actions/profile.ts) ← needs T103
T107 (middleware.ts)       ← standalone change
T108 (AvatarBadge.tsx)    ← standalone
T109 (avatar.test.ts)     ← needs T103
```

Parallel within Phase 2: T103 → then T104, T106, T108, T109 in parallel → then T105, T107.

### Parallel Opportunities per Phase

**Phase 2**: After T103: run T104+T106+T108+T109 in parallel; after T104: run T105.

**Phase 3+4** (once Phase 2 is done): T110–T113 and T114–T118 in parallel.

**Phase 5+7** (once T116–T117 exist): T119–T122 and T126–T128 in parallel.

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Phase 1: Setup (T101–T102)
2. Phase 2: Foundational (T103–T109)
3. Phase 3: Sign-Up (T110–T113)
4. Phase 4: Sign-In / Sign-Out (T114–T118)
5. **STOP and VALIDATE**: Run `npx playwright test tests/e2e/sign-up.spec.ts tests/e2e/sign-in.spec.ts`

### Full Delivery

6. Phase 5: Profile (T119–T122) + Phase 7: User Menu (T126–T128) — in parallel
7. Phase 6: Password Change (T123–T125)
8. Phase 8: Polish (T129–T133)

---

## Notes for Implementer (Codex GPT 5.5)

### Implementation adaptations — 2026-11-18

- Work is on the previously reserved local `002-authentication-profile` branch, fast-forwarded
  from the completed foundation. The feature directory stays `002-auth-profile`.
- Retain the user-approved Next.js 16/React 19 stack and JSON demo mode. Use `proxy.ts` /
  `lib/redirects.ts`, and the existing `tests/unit/` runner instead of unused `__tests__/`.
- bcryptjs already provides TypeScript definitions; no deprecated `@types/bcryptjs` shim is needed.
- The migration adds both User.password and Profile.avatarColorIndex. Existing Profile hashes
  are copied to User before the old hash column is removed. Public profile results contain no hashes.
- Demo writes use an ignored local runtime copy of the sample fixture with serialized, atomic
  writes. Browser tests use a separate data file and server; sample accounts remain unchanged.
- Preserve field errors as structured data, check authentication before profile operations,
  and keep Next.js redirect exceptions outside generic error catches.
- Sign-in limiting uses the Auth.js request argument and a CredentialsSignin subclass with
  `code=RATE_LIMITED`. Forwarded IP headers are accepted only when explicitly trusted.
- The prescribed palette does not support white text at AA contrast on every color; use
  dark initials on the lighter colors while keeping the exact eight-color palette.
- T133 used the isolated production browser suite on port 3010 and manual screenshot
  review because the interactive browser host was unavailable. All 16 quickstart
  scenarios are mapped to passing checks in `quickstart.md`; port-3000 demo data is preserved.
- User-table queries have explicit scalar selections. The two password selections in
  `lib/data/postgres.ts` are internal credential verification only; actions, HTML, and
  session payloads return public identity/profile fields. Auth and Prisma logs omit input data.
- Final checks: 74 unit/component tests, 6 local PostgreSQL integration tests, 29 Chromium
  tests, strict typecheck, lint, and production build passed. No extension hooks are configured.

- **Phase 0 assumed complete**: Do not re-implement Phase 0 files. Only modify them where tasks say so explicitly (T105, T107, T117).
- **TypeScript strict mode**: Zero `any`. All function parameters and return types must be typed. Use `unknown` + narrowing where the type is not known at compile time.
- **`'use server'`** directive: Every file in `lib/actions/` must have `'use server'` as its very first line.
- **`'use client'`** directive: Every component that uses `useState`, `useEffect`, `useRouter`, `useFormStatus`, or `useActionState` must have `'use client'` as its very first line.
- **Server Components** (no directive): `app/(auth)/sign-up/page.tsx`, `app/(protected)/profile/page.tsx`, `components/ui/AvatarBadge.tsx`.
- **Prisma transactions**: In `signUpAction`, create `User` and `Profile` in a single `db.$transaction([...])` to prevent orphaned `User` rows with no `Profile`.
- **Never expose `User.password`**: No Prisma query that returns a `User` should include the `password` field in the `select`. Use explicit `select` on every Prisma query in `lib/actions/profile.ts`.
- **Generic error messages**: For duplicate-email sign-up, the error message MUST NOT say "already registered" or "exists". Use "Please check your details and try again."
- **Avatar color palette**: The 8 hex strings are defined in `lib/avatar.ts`. Import `AVATAR_PALETTE` from there in `ProfileForm.tsx`; do not hardcode hex values in components.
- **`router.refresh()` after profile save**: Call this after a successful `updateProfileAction` to trigger a server re-render of the protected layout and update the header.
