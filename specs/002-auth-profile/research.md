# Research: Authentication and Profile

**Feature**: 002-auth-profile
**Date**: 2026-11-18

---

## Password Hashing

**Decision**: `bcryptjs` (pure-JS bcrypt implementation)
**Rationale**: bcryptjs is the de-facto standard for password hashing in Node.js/Next.js
applications. It has a simple async API (`bcryptjs.hash`, `bcryptjs.compare`), is
well-audited, and works without native bindings (important for edge-compatible builds).
Cost factor of 12 provides good security without noticeable latency on modern hardware
(<200ms per hash on typical server hardware).
**Alternatives considered**:
- `argon2`: More modern, recommended by OWASP; requires native bindings that complicate
  Vercel edge deployment. Acceptable future upgrade but adds friction for the POC.
- `crypto.scrypt` (Node built-in): Works but requires manual salt generation and tuning;
  more boilerplate with no meaningful security advantage over bcrypt at POC scale.

---

## Sign-In Rate Limiting

**Decision**: `rate-limiter-flexible` with in-memory store for development; Redis store
for production (Upstash Redis via `ioredis`).
**Rationale**: `rate-limiter-flexible` is framework-agnostic, well-maintained, and
supports multiple store backends. For the POC, the in-memory store works in development
with zero infrastructure; swapping to Redis (Upstash free tier) for production is a
one-line config change. Limit: 10 attempts per minute per IP (FR-119).
**Implementation pattern**: Rate limit check runs in the sign-in Server Action before
the credential lookup, so it gates even the database query.
**Alternatives considered**:
- `@upstash/ratelimit`: Excellent DX but requires Upstash from day one; unnecessary for
  local development.
- Next.js middleware rate limiting: Runs at the edge before Auth.js; harder to test with
  Vitest because it requires the edge runtime.
- No rate limiting: Explicitly rejected (FR-119).

---

## Avatar Color Assignment

**Decision**: 8 fixed hex colors stored as a palette index (integer 0–7) in the `Profile`
table. Auto-assigned on sign-up by hashing the user's email modulo 8 (deterministic,
avoids a random DB round-trip). User can override the index on the profile page.
**Palette** (accessible, visually distinct):
```
0: #6366f1  (indigo)
1: #8b5cf6  (violet)
2: #ec4899  (pink)
3: #f59e0b  (amber)
4: #10b981  (emerald)
5: #3b82f6  (blue)
6: #ef4444  (red)
7: #14b8a6  (teal)
```
All colors meet WCAG AA contrast against white avatar initials.
**Alternatives considered**:
- Random assignment: Non-deterministic; different on every seed; harder to test.
- Storing the full hex string: Larger column; palette changes require data migration.

---

## Profile Update Strategy

**Decision**: Server Actions with optimistic UI update via `router.refresh()` after save.
**Rationale**: The header user menu reads session data augmented by a fresh profile DB
query on each server render. After a profile save, calling `router.refresh()` on the
client triggers a server re-render of the layout, updating the header without a full
page reload — satisfying SC-104 (< 2s).
**Alternatives considered**:
- `useOptimistic` (React 19 / Next.js 14): More complex; overkill for a low-frequency
  profile update.
- Real-time subscription: Supabase Realtime was the original plan but the stack now uses
  Prisma; polling or refresh is sufficient for the POC.

---

## Password Change Security

**Decision**: Require the current password to be verified with `bcryptjs.compare` before
accepting the new password. The check happens server-side in the `changePassword` Server
Action. Session remains active after a successful change (no forced re-login).
**Rationale**: Requiring the current password prevents an attacker who has gained brief
physical access from changing the password silently. Keeping the session active after
change is standard UX (matches behavior of Google, GitHub, etc.).
**Non-disclosure**: The generic error message for a wrong current password ("Current
password is incorrect") is acceptable because the user is already authenticated — there is
no email enumeration risk on this endpoint.

---

## UserMenu Header Integration

**Decision**: `UserMenu` is a Client Component that receives `displayName`, `avatarInitials`,
and `avatarColor` as props from the parent Server Component (the protected layout). The
layout fetches the profile from the database on each request. After a profile save,
`router.refresh()` causes the layout to re-fetch, keeping the menu in sync.
**Rationale**: Avoids a client-side fetch or React Context for profile data; relies on
Next.js's server-rendering pipeline which already handles session-scoped data fetching.

---

## Sign-Up Flow

**Decision**: Dedicated `/sign-up` page with a `SignUpForm` client component. On submit,
calls a `signUpAction` Server Action that:
1. Validates input with Zod (name, email format, password ≥ 8 chars).
2. Checks for duplicate email (returns generic error if found — FR-104).
3. Hashes password with bcryptjs (cost 12).
4. Creates `User` and `Profile` records in a Prisma transaction.
5. Auto-assigns avatar color (email hash % 8).
6. Calls `signIn('credentials', ...)` to establish a session.
7. Redirects to `/` (welcome card — per clarification Q3).
**Alternatives considered**:
- Calling `signIn` directly from the sign-up page without a Server Action: Less testable;
  mixes UI and business logic.
