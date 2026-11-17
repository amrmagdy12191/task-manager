# Research: Foundation & Architecture

**Feature**: 001-foundation-architecture
**Date**: 2026-11-17

## Decisions & Rationale

### Auth.js v5 (NextAuth) vs Supabase Auth

**Decision**: Auth.js v5 with Prisma adapter
**Rationale**: Auth.js is the canonical authentication solution for Next.js App Router.
It integrates natively with Prisma via `@auth/prisma-adapter`, keeping all session and
account data in the same PostgreSQL database as the rest of the application. No separate
auth service to manage or keep in sync.
**Alternatives considered**:
- Supabase Auth: Tight coupling to Supabase hosted DB; conflicts with Prisma-managed schema.
- Clerk: Excellent DX but adds an external paid service with per-MAU pricing — over-engineered for a POC.
- Custom JWT: Violates Principle VI (no hand-rolled auth logic).

---

### Prisma ORM vs Supabase Client / Drizzle

**Decision**: Prisma ORM 5.x
**Rationale**: Prisma's code-first schema (`schema.prisma`) generates both the TypeScript
client and the SQL migrations, keeping the type system and the database schema in sync
automatically. `prisma migrate dev` satisfies FR-007 (versioned migrations, no dashboard edits).
**Alternatives considered**:
- Supabase JS client: Works against Supabase hosted Postgres only; loses portability.
- Drizzle ORM: Lighter-weight and schema-first, but less mature tooling for migrations and
  less community documentation for Next.js App Router at POC scale.

---

### Next.js Route Protection Strategy

**Decision**: `middleware.ts` at the app root using Auth.js session check
**Rationale**: Next.js middleware runs at the Edge before any page renders, guaranteeing
zero content flash for protected routes (SC-003). The `auth()` helper from Auth.js v5 is
callable inside middleware directly.
**Pattern**:
```ts
// middleware.ts
export { auth as middleware } from "@/lib/auth"
export const config = { matcher: ["/(protected)/:path*"] }
```
**Alternatives considered**:
- Layout-level redirect (server component): Renders layout before redirecting — risks
  flash of unprotected content, violates SC-003.
- Client-side guard (`useSession` + `useRouter`): JavaScript must load first — slow and
  insecure.

---

### Environment Variable Validation

**Decision**: `lib/env.ts` using `zod` schema validation at module load time
**Rationale**: Zod provides typed, declarative validation. Importing `lib/env.ts` in the
app root layout throws a clear error at startup listing every missing or malformed variable
(FR-004). The validated `env` object is re-exported as typed constants — no raw
`process.env` reads elsewhere in the codebase.
**Alternatives considered**:
- `@t3-oss/env-nextjs`: Excellent but adds a dependency for functionality Zod covers directly.
- Manual `if (!process.env.X) throw` guards: Verbose, easy to miss new variables.

---

### Database Schema Approach

**Decision**: Full schema in a single baseline migration (`0001_baseline`)
**Rationale**: User selected Option C in clarification — all seven tables created in Phase 0.
This gives all subsequent feature phases a stable, pre-existing schema to build against.
Prisma `schema.prisma` is the single source of truth; `prisma migrate dev` generates the SQL.
**Tables**: `User`, `Account`, `Session`, `VerificationToken` (Auth.js managed),
`Profile`, `Project`, `Task`, `ProjectMember`, `Comment`, `Notification`, `Tag`, `TaskTag`.

---

### RLS / Access Control Strategy

**Decision**: Prisma middleware + Auth.js session-scoped queries (no native PostgreSQL RLS)
**Rationale**: Unlike Supabase, Prisma connects to Postgres as a single privileged user —
PostgreSQL RLS policies based on `current_user` do not apply per-request. Access control
is enforced at the application layer: every Prisma query in a Server Action or Route Handler
is scoped to the authenticated user's session ID. A Prisma middleware extension logs and
blocks any query attempted without a valid session context.
**Note**: This satisfies the spirit of FR-012 (data isolation per user) while aligning with
the Prisma architecture. The constitution's "RLS on all tables" intent is achieved via
application-layer enforcement rather than PostgreSQL-native RLS.

---

### Testing Setup

**Decision**: Vitest (unit/component) + Playwright (E2E)
**Rationale**:
- Vitest is Vite-native and integrates with Next.js via `@vitejs/plugin-react`. Fast HMR-aware
  test runner; compatible with `@testing-library/react` for component tests.
- Playwright provides real-browser E2E coverage for auth flows (sign-in, redirect, session
  persistence) — critical for SC-003 validation.
**Configuration**:
- `vitest.config.ts` with jsdom environment for component tests.
- `playwright.config.ts` targeting localhost dev server.

---

### Connectivity Banner Implementation

**Decision**: Client component with `useEffect` polling Supabase/DB health endpoint; dismissible via local state
**Rationale**: User selected Option B (dismissible banner, not full-page block). The banner
mounts in the root layout, checks a lightweight `/api/health` route every 30 seconds, and
shows/hides based on response. Dismissed state lives in component state (resets on page
reload — intentional, to re-warn on next visit if still disconnected).
