# Implementation Plan: Authentication and Profile

**Branch**: `002-auth-profile` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-auth-profile/spec.md`

## Summary

Implement email/password sign-up, sign-in, sign-out, session persistence, protected route
enforcement, a user profile page (display name + avatar), and a header user menu — all
building on the Phase 0 Next.js / Prisma / Auth.js foundation. Adds IP-based rate limiting
on the sign-in endpoint (FR-119) and auto-assigns one of 8 preset avatar colors on account
creation.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) — inherited from Phase 0

**Primary Dependencies** (new in this phase):
- `bcryptjs` — password hashing (replaces the Phase 0 credential-provider placeholder)
- `@upstash/ratelimit` + `@upstash/redis` — edge-compatible rate limiting, OR
  `rate-limiter-flexible` — in-memory/Redis rate limiter (see research.md for decision)
- Existing: Next.js 14 App Router, Prisma 5, Auth.js v5, Tailwind CSS, Zod, Vitest, Playwright

**Storage**: PostgreSQL via Prisma — `User` and `Profile` tables already exist in baseline
migration; `password` column added to `User` in this phase's migration

**Testing**: Vitest (unit: password hashing, avatar color assignment, rate limit logic);
Playwright (E2E: sign-up, sign-in, sign-out, profile edit, rate limit trigger)

**Target Platform**: Web (Next.js App Router); same Vercel/Netlify deployment target

**Performance Goals**:
- Sign-up complete in <60s user time (SC-101)
- Profile changes reflected in header within 2s of save (SC-104)

**Constraints**:
- No OAuth / social login (PLAN.md global out-of-scope)
- No password reset / forgot-password flow (Assumptions)
- Rate limit: 10 sign-in attempts per minute per IP (FR-119)
- Avatar: 8 preset colors, auto-assigned on sign-up, editable on profile page (FR-114)
- Error messages MUST NOT reveal whether an email is registered (FR-104, FR-107)
- TypeScript strict mode; zero `any` suppressions

**Scale/Scope**: POC — single-user sign-up flows; no bulk account creation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Managed-Backend-First | PASS | Prisma + Auth.js (Phase 0 approved deviation); no new backend service introduced |
| II. Minimal Scope (YAGNI) | PASS | No OAuth, no password reset, no image uploads, no account deletion |
| III. Semantic HTML + Tailwind | PASS | Forms use `<form>`, `<input>`, `<button>`, `<dialog>`; Tailwind only |
| IV. Client-Side-First | PASS | Profile data is user-scoped and small; no server-side filtering needed |
| V. Accessibility & Responsive | PASS | SC-106 mandates full keyboard operability; forms use semantic HTML |

**Post-Phase-1 re-check**: PASS — data model, contracts, and quickstart all align.

## Project Structure

### Documentation (this feature)

```text
specs/002-auth-profile/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── auth-endpoints.md
│   └── server-actions.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code changes (relative to Phase 0 output)

```text
app/
├── (auth)/
│   ├── sign-in/page.tsx          # EXISTS (Phase 0) — extend with real bcrypt auth
│   └── sign-up/page.tsx          # NEW — sign-up form page
├── (protected)/
│   ├── layout.tsx                # EXISTS — add UserMenu to header
│   ├── page.tsx                  # EXISTS (welcome card) — post-login landing
│   └── profile/
│       └── page.tsx              # NEW — profile view/edit page
│
components/
└── ui/
    ├── SignInForm.tsx             # EXISTS (Phase 0) — wire real bcrypt, add rate-limit error
    ├── SignUpForm.tsx             # NEW
    ├── UserMenu.tsx               # NEW — header dropdown
    ├── ProfileForm.tsx            # NEW — display name + avatar editor
    ├── AvatarBadge.tsx            # NEW — shared initials + color badge
    └── PasswordChangeForm.tsx     # NEW

lib/
├── auth.ts                       # EXISTS — replace placeholder authorize() with bcrypt
├── actions/
│   ├── auth.ts                   # EXISTS (signOutAction) — add signUpAction
│   └── profile.ts                # NEW — updateProfile, changePassword actions
├── avatar.ts                     # NEW — 8-color palette, auto-assign logic
└── rate-limit.ts                 # NEW — sign-in rate limiter

prisma/
└── migrations/
    └── 0002_auth_profile/        # NEW — adds password to User, ensures Profile scaffold
```

## Complexity Tracking

> Prisma + Auth.js deviation inherited from Phase 0 (JUSTIFIED DEVIATION, recorded in `specs/001-foundation-architecture/plan.md`). Constitution amendment pending — see finding C1/C2 in Phase 1 analyze report.

| Decision | Rationale |
|---|---|
| `bcryptjs` over native `crypto.scrypt` | bcryptjs is widely audited, has a simple async API, and is the standard choice for Next.js/Node password hashing; scrypt requires more boilerplate for cost tuning |
| IP-based rate limiting over account lockout | Account lockout creates a denial-of-service vector; IP-based rate limiting balances security and usability (per clarification Q1) |
| 8 fixed avatar colors stored as an index (0–7) | Storing a palette index keeps the DB column small and makes palette changes non-destructive; the color hex values live in `lib/avatar.ts` |
