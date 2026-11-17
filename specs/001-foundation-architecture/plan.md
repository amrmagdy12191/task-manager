# Implementation Plan: Foundation & Architecture

**Branch**: `001-foundation-architecture` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-foundation-architecture/spec.md`

## Summary

Bootstrap the TaskFlow Next.js application with a fully typed TypeScript foundation,
Tailwind CSS styling, PostgreSQL database (via Prisma ORM), Auth.js authentication,
and a complete database schema migration covering all seven application tables. Phase 0
delivers a runnable local environment with authenticated route protection, a welcome home
screen, a dismissible connectivity banner, and a reproducible migration baseline — no
feature UI beyond the welcome card.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**:
- Next.js 16.4.6 (App Router; patched upgrade approved during implementation)
- Tailwind CSS 3.x
- Prisma ORM 5.x
- Auth.js v5 (NextAuth)
- dnd-kit (installed in Phase 0, used in Kanban phase)
- Vitest + @testing-library/react (unit/component tests)
- Playwright (end-to-end tests)

**Implementation update (2026-11-17)**: The user approved upgrading the original Next.js 14
target after its latest patch reported unresolved critical dependency advisories. The app
uses Next.js 16's `proxy.ts` convention, React 19, and compatible patched test/lint tooling.
Prisma 5 and Tailwind 3 remain as planned. Credentials are verified against a bcrypt hash
in Profile, rather than the task template's password-check placeholder.

**Storage**: PostgreSQL 15+ via Prisma ORM; migrations managed with `prisma migrate`

**Testing**: Vitest for unit/component tests; Playwright for E2E flows

**Target Platform**: Web (Vercel/Netlify deployment); responsive from 375px viewport

**Project Type**: Web application (Next.js monorepo — single repo, frontend + API routes)

**Performance Goals**: Home page load <3s on dev machine; migration applies in <10s

**Constraints**:
- TypeScript strict mode: zero `any` suppressions in foundation code
- No custom backend server — Next.js API routes / Server Actions only
- No OAuth social logins, RBAC, rich-text editors, email notifications (POC scope)
- All seven tables get RLS-equivalent access control via Prisma middleware + Auth.js session checks

**Scale/Scope**: POC — single developer team; ~10 concurrent users expected during validation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Managed-Backend-First | **JUSTIFIED DEVIATION** | User explicitly chose Prisma + Auth.js over Supabase. This satisfies the spirit of the principle: no custom auth logic, no hand-rolled backend server. Prisma and Auth.js are established, well-maintained libraries — not reinvented primitives. Deviation recorded. |
| II. Minimal Scope (YAGNI) | PASS | Plan stays within POC scope; no OAuth, RBAC, rich-text, or email notifications |
| III. Component Simplicity & Semantic HTML | PASS | Tailwind only; semantic HTML required |
| IV. Client-Side-First Data Operations | PASS | Search/filter runs client-side |
| V. Accessibility & Responsive Layout | PASS | Mobile layout from 375px; keyboard nav; overdue highlighting; dark/light mode |
| VI. Code Quality & Web Best Practices | PASS | TypeScript strict; Auth.js handles auth; Vitest + Playwright; env var validation at startup |

**Post-Phase-1 re-check**: PASS — data model and contracts align with all principles.

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-architecture/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── auth-endpoints.md
│   └── server-actions.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
taskflow/                        # Next.js app root
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx           # Route guard — redirects unauthenticated users
│   │   └── page.tsx             # Welcome card (home screen)
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts
│   └── layout.tsx               # Root layout — theme provider, session provider
├── components/
│   └── ui/
│       ├── ConnectivityBanner.tsx
│       └── WelcomeCard.tsx
├── lib/
│   ├── auth.ts                  # Auth.js config
│   ├── db.ts                    # Prisma client singleton
│   └── env.ts                   # Startup env validation
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 0001_baseline/
├── middleware.ts                # Next.js route protection middleware
├── tests/
│   ├── unit/
│   └── e2e/
│       └── auth.spec.ts
├── .env.local.example
├── tailwind.config.ts
├── tsconfig.json                # strict: true
└── vitest.config.ts
```

**Structure Decision**: Single Next.js App Router project. API surface is provided by
Next.js Route Handlers (`app/api/`) and Server Actions where appropriate. No separate
backend service. Prisma migrations are the single source of truth for schema.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Supabase replaced by Prisma + Auth.js | User explicitly specified the stack; Prisma gives full schema control via code-first migrations; Auth.js is the idiomatic Next.js auth solution | Supabase Auth ties migrations to the Supabase dashboard and complicates local-first development with Prisma |
