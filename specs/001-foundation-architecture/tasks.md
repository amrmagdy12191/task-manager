# Tasks: Foundation & Architecture

**Input**: Design documents from `/specs/001-foundation-architecture/`

**Target implementor**: A code-generation model with no prior project context.
Every task is self-contained: it states exactly what file to create or edit, what
content or logic to add, and what the done-state looks like. No task requires
reading another task's output to understand what to do.

**Tests**: Vitest (unit/component) + Playwright (E2E) — explicitly requested in plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

## Path Conventions

All paths are relative to the Next.js app root (repository root = `taskflow/`).

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create the Next.js project, install all dependencies, and configure tooling.
Complete this phase entirely before moving to Phase 2.

- [X] T001 Bootstrap Next.js 14 App Router project with TypeScript: run `npx create-next-app@latest taskflow --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"` in the repository root. Confirm `app/`, `lib/`, `public/`, `tailwind.config.ts`, `tsconfig.json`, and `next.config.ts` are created.

- [X] T002 Install runtime dependencies: run `npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter zod @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`. Confirm all appear in `package.json` dependencies.

- [X] T003 [P] Install dev dependencies: run `npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom @playwright/test`. Confirm all appear in `package.json` devDependencies.

- [X] T004 [P] Enable TypeScript strict mode: open `tsconfig.json` and ensure the `compilerOptions` block contains `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitAny": true`. Do not remove any existing options — only add or change these three.

- [X] T005 [P] Create Vitest config: create `vitest.config.ts` at project root with this exact content:
  ```ts
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
  })
  ```

- [X] T006 [P] Create Vitest setup file: create `tests/setup.ts` with this content:
  ```ts
  import '@testing-library/jest-dom'
  ```
  Then run `npm install -D @testing-library/jest-dom` to add the missing devDependency.

- [X] T007 [P] Create Playwright config: create `playwright.config.ts` at project root with this exact content:
  ```ts
  import { defineConfig, devices } from '@playwright/test'

  export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
      baseURL: 'http://localhost:3000',
      trace: 'on-first-retry',
    },
    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  })
  ```

- [X] T008 [P] Add npm scripts to `package.json`. Open `package.json` and add these entries inside the `"scripts"` object (do not remove existing scripts):
  ```json
  "test": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "db:migrate": "prisma migrate dev",
  "db:generate": "prisma generate",
  "db:studio": "prisma studio",
  "typecheck": "tsc --noEmit"
  ```

- [X] T009 [P] Create `.env.local.example` at project root with this content (no real secrets):
  ```
  # Copy this file to .env.local and fill in real values
  DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/taskflow"
  NEXTAUTH_SECRET="replace-with-32-char-random-string"
  NEXTAUTH_URL="http://localhost:3000"
  ```
  Also add `.env.local` to `.gitignore` if not already present.

- [X] T010 Create `tests/` directory structure: run `mkdir -p tests/unit tests/e2e`. Create placeholder files `tests/unit/.gitkeep` and `tests/e2e/.gitkeep` so the directories are tracked by git.

**Checkpoint — Phase 1 done when**: `npm run typecheck` exits with 0 errors, `npm run dev` starts the Next.js dev server at `http://localhost:3000`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Environment validation, database schema, Prisma client, Auth.js wiring, and
route protection middleware. MUST be 100% complete before any user story work starts.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Environment Validation

- [X] T011 Create `lib/env.ts` — startup environment variable validation using Zod. Create the file with this exact content:
  ```ts
  import { z } from 'zod'

  const envSchema = z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
    NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  })

  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const missing = parsed.error.errors.map(e => `  • ${e.path.join('.')}: ${e.message}`)
    throw new Error(
      `\n\nMissing or invalid environment variables:\n${missing.join('\n')}\n\nCopy .env.local.example to .env.local and fill in all values.\n`
    )
  }

  export const env = parsed.data
  ```

### Database Schema & Prisma

- [X] T012 Initialise Prisma: run `npx prisma init --datasource-provider postgresql` from the project root. This creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env` (you can delete `.env` — the project uses `.env.local`). Confirm `prisma/schema.prisma` exists.

- [X] T013 Write the full Prisma schema: overwrite `prisma/schema.prisma` with the content below. This creates all 12 tables in one file (Auth.js tables + 7 application tables).
  ```prisma
  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  // ─── Auth.js required tables ─────────────────────────────────────────────────

  model User {
    id            String    @id @default(cuid())
    name          String?
    email         String    @unique
    emailVerified DateTime?
    image         String?
    accounts      Account[]
    sessions      Session[]
    profile       Profile?
    ownedProjects Project[]
    memberOf      ProjectMember[]
    assignedTasks Task[]    @relation("AssignedTasks")
    createdTasks  Task[]    @relation("CreatedTasks")
    comments      Comment[]
    notifications Notification[]
  }

  model Account {
    id                String  @id @default(cuid())
    userId            String
    type              String
    provider          String
    providerAccountId String
    refresh_token     String? @db.Text
    access_token      String? @db.Text
    expires_at        Int?
    token_type        String?
    scope             String?
    id_token          String? @db.Text
    session_state     String?
    user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([provider, providerAccountId])
  }

  model Session {
    id           String   @id @default(cuid())
    sessionToken String   @unique
    userId       String
    expires      DateTime
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }

  model VerificationToken {
    identifier String
    token      String   @unique
    expires    DateTime

    @@unique([identifier, token])
  }

  // ─── Application tables ───────────────────────────────────────────────────────

  model Profile {
    id             String   @id @default(cuid())
    userId         String   @unique
    displayName    String   // max 100 chars — enforce in application layer
    avatarInitials String   // 2 chars, computed from displayName
    createdAt      DateTime @default(now())
    updatedAt      DateTime @updatedAt
    user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }

  model Project {
    id          String          @id @default(cuid())
    name        String          // max 100 chars — enforce in application layer
    description String?
    ownerId     String
    createdAt   DateTime        @default(now())
    updatedAt   DateTime        @updatedAt
    owner       User            @relation(fields: [ownerId], references: [id])
    members     ProjectMember[]
    tasks       Task[]
    tags        Tag[]
  }

  model ProjectMember {
    id        String   @id @default(cuid())
    projectId String
    userId    String
    joinedAt  DateTime @default(now())
    project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([projectId, userId])
  }

  model Task {
    id          String     @id @default(cuid())
    projectId   String
    title       String     // max 200 chars — enforce in application layer
    description String?    // plain text or basic Markdown
    status      TaskStatus @default(TODO)
    priority    Priority   @default(MEDIUM)
    dueDate     DateTime?
    assigneeId  String?
    createdById String
    position    Float      @default(0) // ordering within status column
    createdAt   DateTime   @default(now())
    updatedAt   DateTime   @updatedAt
    project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
    assignee    User?      @relation("AssignedTasks", fields: [assigneeId], references: [id])
    createdBy   User       @relation("CreatedTasks", fields: [createdById], references: [id])
    comments    Comment[]
    tags        TaskTag[]
  }

  model Comment {
    id        String   @id @default(cuid())
    taskId    String
    authorId  String
    body      String   // max 2000 chars — enforce in application layer
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
    author    User     @relation(fields: [authorId], references: [id])
  }

  model Notification {
    id          String           @id @default(cuid())
    recipientId String
    type        NotificationType
    taskId      String?
    read        Boolean          @default(false)
    createdAt   DateTime         @default(now())
    recipient   User             @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  }

  model Tag {
    id        String    @id @default(cuid())
    name      String    // max 50 chars — enforce in application layer
    projectId String
    project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
    tasks     TaskTag[]

    @@unique([name, projectId])
  }

  model TaskTag {
    taskId String
    tagId  String
    task   Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
    tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

    @@id([taskId, tagId])
  }

  // ─── Enums ────────────────────────────────────────────────────────────────────

  enum TaskStatus {
    TODO
    IN_PROGRESS
    IN_REVIEW
    DONE
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum NotificationType {
    TASK_ASSIGNED
    MENTIONED
  }
  ```

- [X] T014 Create the Prisma client singleton: create `lib/db.ts` with this exact content:
  ```ts
  import { PrismaClient } from '@prisma/client'

  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

  export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
  ```
  The singleton pattern prevents multiple PrismaClient instances in Next.js hot-reload.

- [X] T014b Create Prisma access-control middleware extension: create `lib/db-middleware.ts`
  with this exact content:
  ```ts
  import { db } from '@/lib/db'

  // Extends the Prisma client with a query middleware that enforces session-scoped access.
  // Every model operation must be called with an authenticated userId in context.
  // This satisfies FR-012: access control on all 7 application tables at the application layer.

  export function withAccessControl(userId: string) {
    return db.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query, model, operation }) {
            if (process.env.NODE_ENV === 'development') {
              console.debug(`[db] ${operation} on ${model} by user ${userId}`)
            }
            return query(args)
          },
        },
      },
    })
  }

  // Guard: throws if no session is provided to a data-access function.
  export function requireUserId(userId: string | undefined): asserts userId is string {
    if (!userId) {
      throw new Error('UNAUTHORIZED: data access requires an authenticated session')
    }
  }
  ```
  Usage: in every Server Action, call `requireUserId(session.user.id)` before any Prisma
  query. Use `withAccessControl(session.user.id)` for the extended client when per-query
  logging is needed. This satisfies FR-012's access-isolation requirement via application-
  layer enforcement (Prisma architecture does not support per-request PostgreSQL RLS —
  see research.md RLS decision).

- [X] T015 Generate Prisma client and run baseline migration: with a running PostgreSQL instance and `.env.local` populated, run:
  ```bash
  npx prisma generate
  npx prisma migrate dev --name baseline
  ```
  Expected: a `prisma/migrations/` directory is created containing `0001_baseline/migration.sql`. All 12 tables exist in the database. Note: access control is enforced at the application layer via `lib/db-middleware.ts` (T014b), not PostgreSQL-native RLS, because Prisma connects as a single privileged user (see research.md RLS decision). If Postgres is not yet available, run `npx prisma generate` only and skip `migrate dev` until Postgres is ready.

### Auth.js Configuration

- [X] T016 Create Auth.js config: create `lib/auth.ts` with this exact content:
  ```ts
  import NextAuth from 'next-auth'
  import { PrismaAdapter } from '@auth/prisma-adapter'
  import Credentials from 'next-auth/providers/credentials'
  import { db } from '@/lib/db'
  import { env } from '@/lib/env'
  import { z } from 'zod'

  // Minimal credentials schema — email + password
  const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })

  export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(db),
    secret: env.NEXTAUTH_SECRET,
    session: { strategy: 'jwt' },
    pages: {
      signIn: '/sign-in',
    },
    providers: [
      Credentials({
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          const parsed = credentialsSchema.safeParse(credentials)
          if (!parsed.success) return null

          // Placeholder: look up user by email.
          // A real implementation hashes + compares passwords.
          const user = await db.user.findUnique({
            where: { email: parsed.data.email },
          })

          if (!user) return null
          // TODO (auth feature phase): add bcrypt password comparison here
          return user
        },
      }),
    ],
    callbacks: {
      async session({ session, token }) {
        if (token.sub) session.user.id = token.sub
        return session
      },
      async jwt({ token, user }) {
        if (user) token.sub = user.id
        return token
      },
    },
  })
  ```

- [X] T017 Create Auth.js route handler: create `app/api/auth/[...nextauth]/route.ts` with this exact content:
  ```ts
  import { handlers } from '@/lib/auth'

  export const { GET, POST } = handlers
  ```

### Health Check Route

- [X] T018 Create health check API route: create `app/api/health/route.ts` with this exact content:
  ```ts
  import { NextResponse } from 'next/server'
  import { db } from '@/lib/db'

  export async function GET() {
    try {
      await db.$queryRaw`SELECT 1`
      return NextResponse.json({ status: 'ok' })
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'Database unreachable' },
        { status: 503 }
      )
    }
  }
  ```

### Route Protection Middleware

- [X] T019 Create Next.js middleware for route protection: create `middleware.ts` at the project root (same level as `app/`) with this exact content:
  ```ts
  import { auth } from '@/lib/auth'
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'

  export default auth(function middleware(req) {
    const { nextUrl, auth: session } = req as NextRequest & { auth: unknown }
    const isLoggedIn = !!session
    // /sign-up is excluded until a sign-up page is implemented (Phase 0 scope — FR-006)
    const isAuthRoute = nextUrl.pathname.startsWith('/sign-in')
    const isProtected = !isAuthRoute &&
                        !nextUrl.pathname.startsWith('/api/auth') &&
                        !nextUrl.pathname.startsWith('/api/health')

    if (isProtected && !isLoggedIn) {
      const redirectUrl = new URL('/sign-in', nextUrl)
      redirectUrl.searchParams.set('callbackUrl', nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    if (isAuthRoute && isLoggedIn) {
      return NextResponse.redirect(new URL('/', nextUrl))
    }

    return NextResponse.next()
  })

  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  }
  ```

### Root Layout with Session Provider

- [X] T020 Update root layout: overwrite `app/layout.tsx` with this content:
  ```tsx
  import type { Metadata } from 'next'
  import { Inter } from 'next/font/google'
  import './globals.css'
  import { SessionProvider } from 'next-auth/react'

  const inter = Inter({ subsets: ['latin'] })

  export const metadata: Metadata = {
    title: 'TaskFlow',
    description: 'Task management for teams',
  }

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <SessionProvider>
            {children}
          </SessionProvider>
        </body>
      </html>
    )
  }
  ```

**Checkpoint — Phase 2 done when**:
- `npx prisma migrate dev` applies with zero errors
- `GET http://localhost:3000/api/health` returns `{ "status": "ok" }`
- Navigating to `http://localhost:3000` while signed out redirects to `/sign-in`
- `npm run typecheck` exits with 0 errors

---

## Phase 3: User Story 1 — Developer Can Run the App Locally (Priority: P1) 🎯 MVP

**Goal**: A developer signs in and sees a welcome card with their name and a "Connected"
status indicator. The app environment is fully validated and self-documenting.

**Independent Test**: Sign in with valid credentials → see welcome card → sign out → redirected
to sign-in. Run `npm run typecheck` and `npx playwright test tests/e2e/auth.spec.ts`.

### E2E Tests for User Story 1

- [X] T021 [P] [US1] Create Playwright E2E test file: create `tests/e2e/auth.spec.ts` with this content:
  ```ts
  import { test, expect } from '@playwright/test'

  test.describe('Authentication flows', () => {
    test('unauthenticated user is redirected to sign-in', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveURL(/\/sign-in/)
    })

    test('sign-in page is accessible when signed out', async ({ page }) => {
      await page.goto('/sign-in')
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    })

    test('authenticated user is redirected away from sign-in', async ({ page, context }) => {
      // Set a mock session cookie — replace with real login once sign-in page is built
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'test', // Playwright will get a real redirect; this is a structural test
        domain: 'localhost',
        path: '/',
      }])
      await page.goto('/sign-in')
      // With a valid session, the middleware redirects to /
      // This test validates the redirect logic is wired; adjust once real auth is in place
    })
  })
  ```
  **Note**: Full sign-in E2E tests require the sign-in page (T023). These tests validate redirect wiring first.

### Implementation for User Story 1

- [X] T022 [P] [US1] Create ConnectivityBanner component: create `components/ui/ConnectivityBanner.tsx` with this content:
  ```tsx
  'use client'

  import { useState, useEffect, useCallback } from 'react'

  export function ConnectivityBanner() {
    const [offline, setOffline] = useState(false)
    const [dismissed, setDismissed] = useState(false)

    const checkHealth = useCallback(async () => {
      try {
        const res = await fetch('/api/health')
        setOffline(!res.ok)
        if (res.ok) setDismissed(false) // re-show if connection restored
      } catch {
        setOffline(true)
      }
    }, [])

    useEffect(() => {
      checkHealth()
      const interval = setInterval(checkHealth, 30_000)
      return () => clearInterval(interval)
    }, [checkHealth])

    if (!offline || dismissed) return null

    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-4 bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200"
      >
        <span>⚠ Unable to reach the server. Data shown may be stale.</span>
        <div className="flex gap-2">
          <button
            onClick={checkHealth}
            className="font-medium underline hover:no-underline"
          >
            Retry
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss connectivity warning"
            className="font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }
  ```

- [X] T023 [P] [US1] Create WelcomeCard component: create `components/ui/WelcomeCard.tsx` with this content:
  ```tsx
  interface WelcomeCardProps {
    displayName: string
    email: string
    isConnected: boolean
  }

  export function WelcomeCard({ displayName, email, isConnected }: WelcomeCardProps) {
    const initials = displayName
      .split(' ')
      .map(w => w[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('')

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800 max-w-md w-full">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold text-lg">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            aria-hidden="true"
          />
          <span className={isConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    )
  }
  ```

- [X] T024 [US1] Create the protected route group layout: create `app/(protected)/layout.tsx` with this content:
  ```tsx
  import { auth } from '@/lib/auth'
  import { redirect } from 'next/navigation'
  import { ConnectivityBanner } from '@/components/ui/ConnectivityBanner'

  export default async function ProtectedLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    const session = await auth()
    if (!session) redirect('/sign-in')

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ConnectivityBanner />
        <main>{children}</main>
      </div>
    )
  }
  ```

- [X] T025 [US1] Create the home page (welcome card): create `app/(protected)/page.tsx` with this content:
  ```tsx
  import { auth } from '@/lib/auth'
  import { redirect } from 'next/navigation'
  import { WelcomeCard } from '@/components/ui/WelcomeCard'

  async function getConnectionStatus(): Promise<boolean> {
    try {
      const res = await fetch(`${process.env.NEXTAUTH_URL}/api/health`, {
        cache: 'no-store',
      })
      return res.ok
    } catch {
      return false
    }
  }

  export default async function HomePage() {
    const session = await auth()
    if (!session?.user) redirect('/sign-in')

    const isConnected = await getConnectionStatus()

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <WelcomeCard
          displayName={session.user.name ?? session.user.email ?? 'User'}
          email={session.user.email ?? ''}
          isConnected={isConnected}
        />
      </div>
    )
  }
  ```

- [X] T026 [US1] Create the sign-in page: create `app/(auth)/sign-in/page.tsx` with this content:
  ```tsx
  import { auth } from '@/lib/auth'
  import { redirect } from 'next/navigation'
  import { SignInForm } from '@/components/ui/SignInForm'

  export default async function SignInPage({
    searchParams,
  }: {
    searchParams: { callbackUrl?: string }
  }) {
    const session = await auth()
    if (session) redirect(searchParams.callbackUrl ?? '/')

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Sign in to TaskFlow
          </h1>
          <SignInForm callbackUrl={searchParams.callbackUrl ?? '/'} />
        </div>
      </div>
    )
  }
  ```

- [X] T027 [US1] Create the SignInForm client component: create `components/ui/SignInForm.tsx` with this content:
  ```tsx
  'use client'

  import { useState } from 'react'
  import { signIn } from 'next-auth/react'
  import { useRouter } from 'next/navigation'

  export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      setError(null)
      setLoading(true)

      const formData = new FormData(e.currentTarget)
      const result = await signIn('credentials', {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        redirect: false,
      })

      setLoading(false)

      if (result?.error) {
        setError('Invalid email or password.')
        return
      }

      router.push(callbackUrl)
      router.refresh()
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    )
  }
  ```

- [X] T028 [US1] Write Vitest unit test for WelcomeCard: create `tests/unit/WelcomeCard.test.tsx` with this content:
  ```tsx
  import { render, screen } from '@testing-library/react'
  import { WelcomeCard } from '@/components/ui/WelcomeCard'

  describe('WelcomeCard', () => {
    it('renders the user display name', () => {
      render(<WelcomeCard displayName="Alice Smith" email="alice@example.com" isConnected={true} />)
      expect(screen.getByText(/welcome back, alice smith/i)).toBeInTheDocument()
    })

    it('renders avatar initials from display name', () => {
      render(<WelcomeCard displayName="Alice Smith" email="alice@example.com" isConnected={true} />)
      expect(screen.getByText('AS')).toBeInTheDocument()
    })

    it('shows Connected status when isConnected is true', () => {
      render(<WelcomeCard displayName="Alice" email="a@b.com" isConnected={true} />)
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })

    it('shows Disconnected status when isConnected is false', () => {
      render(<WelcomeCard displayName="Alice" email="a@b.com" isConnected={false} />)
      expect(screen.getByText('Disconnected')).toBeInTheDocument()
    })
  })
  ```

**Checkpoint — User Story 1 done when**:
- `npm test` passes all WelcomeCard unit tests
- Navigating to `http://localhost:3000` while signed out → redirects to `/sign-in`
- After signing in → welcome card shows user name + "Connected" indicator
- `npm run typecheck` → 0 errors

---

## Phase 4: User Story 2 — Authenticated Route Protection Works (Priority: P2)

**Goal**: Route protection is fully verified — unauthenticated visitors never see protected
content; post-login redirect preserves the originally requested URL.

**Independent Test**: Can be fully validated by visiting protected URLs while signed out,
signing in, and confirming the redirect target. Run `npx playwright test tests/e2e/auth.spec.ts`.

### E2E Tests for User Story 2

- [X] T029 [P] [US2] Extend E2E auth spec — add these two tests to `tests/e2e/auth.spec.ts` inside the `test.describe` block:
  ```ts
  test('callbackUrl is preserved after sign-in redirect', async ({ page }) => {
    // Visit a protected route while signed out
    await page.goto('/some-protected-page')
    // Expect redirect to sign-in with callbackUrl param
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=/)
    const url = new URL(page.url())
    expect(url.searchParams.get('callbackUrl')).toBe('/some-protected-page')
  })

  test('sign-in page shows correct heading', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.getByRole('heading', { name: /sign in to taskflow/i })).toBeVisible()
  })
  ```

### Implementation for User Story 2

The middleware (T019) and sign-in page (T026–T027) already implement the core redirect
behaviour. This phase validates it end-to-end and adds the sign-out action.

- [X] T030 [US2] Create a sign-out server action: create `lib/actions/auth.ts` with this content:
  ```ts
  'use server'

  import { signOut } from '@/lib/auth'

  export async function signOutAction() {
    await signOut({ redirectTo: '/sign-in' })
  }
  ```

- [X] T031 [US2] Add a sign-out button to the welcome card page: edit `app/(protected)/page.tsx`. After the `<WelcomeCard />` component, add:
  ```tsx
  import { signOutAction } from '@/lib/actions/auth'

  // Add inside the return, below WelcomeCard:
  <form action={signOutAction} className="mt-4">
    <button
      type="submit"
      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
    >
      Sign out
    </button>
  </form>
  ```
  The full updated return block:
  ```tsx
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-4">
      <WelcomeCard
        displayName={session.user.name ?? session.user.email ?? 'User'}
        email={session.user.email ?? ''}
        isConnected={isConnected}
      />
      <form action={signOutAction}>
        <button
          type="submit"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
        >
          Sign out
        </button>
      </form>
    </div>
  )
  ```

- [X] T032 [P] [US2] Write Vitest unit test for middleware redirect logic: create `tests/unit/middleware.test.ts` with this content:
  ```ts
  // This test validates the callbackUrl construction logic in isolation.
  // It does not require Next.js to be running.

  describe('callbackUrl construction', () => {
    it('encodes the original pathname as callbackUrl', () => {
      const originalPath = '/board'
      const redirectUrl = new URL('/sign-in', 'http://localhost:3000')
      redirectUrl.searchParams.set('callbackUrl', originalPath)
      expect(redirectUrl.searchParams.get('callbackUrl')).toBe('/board')
      expect(redirectUrl.pathname).toBe('/sign-in')
    })
  })
  ```

**Checkpoint — User Story 2 done when**:
- `npx playwright test tests/e2e/auth.spec.ts` passes all tests
- Visiting any protected route while signed out → redirected to `/sign-in?callbackUrl=<path>`
- Signing in → redirected to original path
- Clicking "Sign out" → session cleared, redirected to `/sign-in`

---

## Phase 5: User Story 3 — Database Schema Is Reproducible (Priority: P3)

**Goal**: Any developer can run a single command to apply the full schema to a blank
database with zero manual steps.

**Independent Test**: Drop all tables, run `npx prisma migrate dev`, confirm all 12
tables exist via `npx prisma studio` or `SELECT table_name FROM information_schema.tables`.

### Implementation for User Story 3

The migration was created in T015. This phase ensures it is complete, documented,
and validates idempotency.

- [X] T033 [US3] Verify the baseline migration SQL is complete: open `prisma/migrations/0001_baseline/migration.sql` (generated by T015). Confirm it contains `CREATE TABLE` statements for all 12 models: `User`, `Account`, `Session`, `VerificationToken`, `Profile`, `Project`, `ProjectMember`, `Task`, `Comment`, `Notification`, `Tag`, `TaskTag`. If any are missing, re-run `npx prisma migrate dev --name baseline` after ensuring the schema in T013 is saved correctly.

- [X] T034 [US3] Write the README: create `README.md` at the project root with this content:
  ````md
  # TaskFlow

  Task management POC built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and Auth.js.

  ## Prerequisites

  - Node.js 20 LTS
  - npm 10+
  - PostgreSQL 15+

  ## Setup

  ### 1. Install dependencies

  ```bash
  npm install
  ```

  ### 2. Configure environment variables

  ```bash
  cp .env.local.example .env.local
  ```

  Edit `.env.local` and fill in:

  | Variable | Description | Example |
  |---|---|---|
  | `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/taskflow` |
  | `NEXTAUTH_SECRET` | 32+ char random string | `openssl rand -base64 32` |
  | `NEXTAUTH_URL` | App base URL | `http://localhost:3000` |

  ### 3. Apply database migrations

  ```bash
  npm run db:migrate
  ```

  This creates all application tables in one step. Run it against a blank database — it is
  idempotent and safe to re-run.

  ### 4. Start the development server

  ```bash
  npm run dev
  ```

  Open [http://localhost:3000](http://localhost:3000).

  ## Available Commands

  | Command | Description |
  |---|---|
  | `npm run dev` | Start development server |
  | `npm run build` | Production build |
  | `npm run typecheck` | TypeScript type check (zero errors required) |
  | `npm test` | Run Vitest unit/component tests |
  | `npm run test:e2e` | Run Playwright E2E tests |
  | `npm run db:migrate` | Apply pending Prisma migrations |
  | `npm run db:studio` | Open Prisma Studio (database browser) |

  ## Project Structure

  ```
  app/                   Next.js App Router pages
  ├── (auth)/            Public auth pages (sign-in; sign-up deferred to later phase)
  ├── (protected)/       Authenticated pages (requires sign-in)
  └── api/               API route handlers
  components/ui/         Shared UI components
  lib/                   Shared utilities (db, auth, env, actions)
  prisma/                Prisma schema and migrations
  tests/                 Vitest unit tests + Playwright E2E tests
  ```
  ````

- [X] T035 [US3] Validate idempotent migration: with the database already migrated, run `npx prisma migrate dev` again. Expected output: `"Already in sync, no schema changes or pending migrations"` (or equivalent). If it tries to create a new migration, the schema.prisma and the applied migration are out of sync — resolve by running `npx prisma migrate resolve` per Prisma docs.

**Checkpoint — User Story 3 done when**:
- `npm run db:migrate` on a blank database creates all 12 tables with no errors
- Re-running `npm run db:migrate` on an already-migrated database is a no-op
- `README.md` exists and covers all setup steps

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tie up TypeScript strictness, dark mode wiring, and quickstart validation.

- [X] T036 [P] Add dark mode class strategy to Tailwind config: open `tailwind.config.ts` and ensure `darkMode: 'class'` is set:
  ```ts
  import type { Config } from 'tailwindcss'
  const config: Config = {
    darkMode: 'class',
    content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
    theme: { extend: {} },
    plugins: [],
  }
  export default config
  ```

- [X] T037 [P] Create dark mode toggle utility: create `lib/theme.ts` with this content:
  ```ts
  // Reads/writes dark mode preference to localStorage and applies the 'dark' class to <html>.
  // Called from a client component — do not import in Server Components.

  export function getTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('theme') as 'dark' | 'light') ?? 'light'
  }

  export function setTheme(theme: 'dark' | 'light') {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }

  export function initTheme() {
    setTheme(getTheme())
  }
  ```

- [X] T038 [P] Add theme initialisation to root layout: edit `app/layout.tsx`. Add a `<script>` tag inside `<html>` before `<body>` to prevent flash of wrong theme:
  ```tsx
  <html lang="en" suppressHydrationWarning>
    <head>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch(e){}
          `,
        }}
      />
    </head>
    <body className={inter.className}>
      <SessionProvider>{children}</SessionProvider>
    </body>
  </html>
  ```

- [X] T039 Final typecheck: run `npm run typecheck`. Expected: 0 errors, 0 warnings. Fix any type errors before marking this task complete. Common fixes: add missing return types, replace inferred `any` from Prisma query results with generated Prisma types.

- [X] T040 Run full test suite: run `npm test` (Vitest) and `npm run test:e2e` (Playwright). All tests must pass. Document any skipped tests with a `// TODO` comment explaining why.

- [X] T041 [P] Run quickstart validation: follow every scenario in `specs/001-foundation-architecture/quickstart.md` manually. Mark each scenario as ✅ or ❌ in a comment in this task. All 8 scenarios must pass before this task is complete.

<!-- Quickstart validation — 2026-11-17 (Asia/Dubai)
Scenario 1 ✅ Missing NEXTAUTH_SECRET exits before Next.js starts and names the setting.
Scenario 2 ✅ HTTP 307 to /sign-in?callbackUrl=%2F, with no protected HTML returned.
Scenario 3 ✅ Real seeded credentials render the display name and Connected status.
Scenario 4 ✅ Authenticated /sign-in redirects to /.
Scenario 5 ✅ Baseline applied to blank PostgreSQL 16; repeated migrate reports already in sync.
Scenario 6 ✅ Real Docker database pause: page rendered in 2150ms, health returned 503,
              Retry recovered after resume; dismiss and sign-out remained available.
Scenario 7 ✅ Strict TypeScript and ESLint pass; no any/@ts-ignore/@ts-nocheck suppressions.
Scenario 8 ✅ All 14 Chromium tests pass, including all nine authentication scenarios.
Additional verification: 46 unit/component tests, four PostgreSQL integration tests,
production build, mobile/desktop light/dark screenshot review, zero npm audit findings.
-->

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Requires Phase 1 complete — BLOCKS all user stories
- **Phase 3 (US1)**: Requires Phase 2 complete
- **Phase 4 (US2)**: Requires Phase 2 complete; middleware from Phase 2 is a prerequisite
- **Phase 5 (US3)**: Requires Phase 2 complete (migration created in T015)
- **Phase 6 (Polish)**: Requires Phases 3–5 complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Can start after Phase 2 — middleware already built in Phase 2
- **US3 (P3)**: Can start after Phase 2 — migration already applied in T015

### Within Each Phase

- T001 must complete before T002–T010 (project must exist first)
- T011–T015 (env + schema) must complete before T016–T020 (auth needs db client)
- T016 must complete before T017 (route handler imports from lib/auth)
- T020 (root layout) must complete before any page renders correctly
- Within each user story: components (T022–T023) can be built in parallel before pages (T024–T027) that import them

---

## Parallel Execution Examples

### Phase 1 — all after T001:
```
T002 (npm install runtime) ‖ T003 (npm install dev) ‖ T004 (tsconfig) ‖ T005 (vitest.config)
T006 (tests/setup.ts) ‖ T007 (playwright.config) ‖ T008 (npm scripts) ‖ T009 (.env.local.example)
```

### Phase 2 — after T012 + T013:
```
T011 (env validation)  ← independent
T014 (db.ts singleton) ← after T013
T015 (migrate)         ← after T013 + T014
T016 (auth.ts)         ← after T014
T017 (route handler)   ← after T016
T018 (health route)    ← after T014
T019 (middleware)      ← after T016
T020 (root layout)     ← after T016
```

### Phase 3 — US1 components in parallel:
```
T022 (ConnectivityBanner) ‖ T023 (WelcomeCard) ‖ T021 (E2E tests)
T024 (protected layout) ← after T022
T025 (home page)        ← after T023 + T024
T026 (sign-in page)     ← after T027
T027 (SignInForm)       ← independent
T028 (WelcomeCard test) ← after T023
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T010)
2. Complete Phase 2: Foundational (T011–T020)
3. Complete Phase 3: User Story 1 (T021–T028)
4. **STOP and VALIDATE**: Run `npm test`, `npm run test:e2e`, `npm run typecheck`
5. Demo: sign in → see welcome card → sign out → redirected to sign-in

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Running app with auth ✅
3. Phase 4 (US2) → Full route protection verified ✅
4. Phase 5 (US3) → Reproducible schema + README ✅
5. Phase 6 → Polished, type-safe, dark-mode ready ✅

---

## Notes

### Implementation decisions (2026-11-17)

- The repository is the app root; bootstrap files are created in place to preserve the
  existing specification files. Prisma 5 and Tailwind 3 stay as planned. After the initial Next.js 14 scaffold passed
  typecheck/startup, the user approved upgrading Next.js to the current patched release
  because npm audit reported unresolved critical advisories in 14.2.35.
- The upgraded Next.js supports `next.config.ts` and uses `proxy.ts` for route protection.
  Vitest, ESLint, React, and Zod are updated to compatible patched versions as well.
- Credentials must verify a password hash. The placeholder that accepts any password is
  replaced with bcrypt verification and an explicit local seed command. The password hash
  lives in Profile so the Auth.js-managed User schema remains unchanged.
- Auth.js config is split so Edge middleware never imports Prisma. Redirect callbacks
  preserve query strings and only accept safe local application paths.
- Prisma scripts explicitly load `.env.local`; Prisma 5 does not load it automatically.
- Access control follows the application-layer decision in plan.md/research.md, not native
  RLS. The foundation exposes scoped reads and denies unimplemented writes; logging alone
  is not an authorization boundary. Future feature actions must add explicit write rules.
- Browser tests use real seeded credentials and assertions instead of a fabricated cookie.
- Real-outage validation exposed indefinitely stalled database reads; health, profile,
  and credential reads now have a two-second response deadline. Underlying reads remain
  owned by Prisma; this helper must not be used to retry writes.
- System fonts avoid a network dependency at build time. Theme utilities and initialization
  are included; a theme toggle and feature navigation remain outside Phase 0 scope.

- `[P]` tasks operate on different files — safe to run in parallel
- `[US1/2/3]` maps each task to a user story for traceability
- Every task includes exact file content — no inference required from the implementor
- Prisma-generated types (`Task`, `User`, etc.) are available after `npm run db:generate`
- Do not use `any` types — use Prisma's generated types (`Prisma.TaskGetPayload<...>`) where needed
- Commit after each checkpoint to preserve working state
