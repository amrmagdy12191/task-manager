# Feature Specification: Foundation & Architecture

**Feature Branch**: `001-foundation-architecture`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Read PLAN.md and create a specification for the phase 0: foundation and Architecture page ONLY."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Can Run the App Locally (Priority: P1)

A developer clones the repository, installs dependencies, adds the required environment
variables, and starts the development server. The application loads in a browser with no
errors, displaying a placeholder home screen that confirms the frontend, backend connection,
and authentication service are all wired up correctly.

**Why this priority**: Without a runnable local environment the entire project is blocked.
Every subsequent feature depends on this foundation being stable.

**Independent Test**: A developer with no prior setup can follow the README, run the dev
server, and see a rendered page — this fully validates the foundation in isolation.

**Acceptance Scenarios**:

1. **Given** a fresh clone with no prior setup, **When** the developer installs dependencies
   and starts the dev server, **Then** the application loads at the local dev URL with no
   console errors.
2. **Given** required environment variables are missing, **When** the application starts,
   **Then** a clear error message names the missing variable(s) rather than crashing silently.
3. **Given** the app is running and the user is signed in, **When** the developer navigates
   to the app root, **Then** they see a welcome card displaying the user's name and a
   "connected" status indicator confirming the backend is reachable.

---

### User Story 2 - Authenticated Route Protection Works (Priority: P2)

A visitor who is not signed in attempts to navigate to a protected page (e.g., the task
board). They are automatically redirected to the sign-in page. After signing in they are
returned to the originally requested page.

**Why this priority**: Route protection is a cross-cutting concern that every feature page
relies on. Getting it right in Phase 0 prevents retrofitting later.

**Independent Test**: Can be fully tested by visiting a protected URL while signed out,
confirming the redirect, signing in, and confirming arrival at the intended page.

**Acceptance Scenarios**:

1. **Given** a visitor is not authenticated, **When** they navigate to any protected route,
   **Then** they are redirected to the sign-in page immediately.
2. **Given** a visitor is redirected to sign-in from `/board`, **When** they successfully
   sign in, **Then** they land on `/board`, not the app root.
3. **Given** an authenticated user, **When** they navigate to the sign-in page directly,
   **Then** they are redirected to the app root (no sign-in loop).

---

### User Story 3 - Database Schema Is Reproducible (Priority: P3)

A developer starting fresh can apply all database migrations in one command and reach
the same schema state as every other developer. No manual table creation in the dashboard
is required.

**Why this priority**: Reproducibility prevents environment drift. All subsequent features
add migrations on top of this baseline, so the migration mechanism must work before they
are written.

**Independent Test**: Can be tested by applying migrations against a blank database and
confirming all expected tables exist with correct columns.

**Acceptance Scenarios**:

1. **Given** a blank database, **When** the developer runs the migration command, **Then**
   all baseline tables are created without errors.
2. **Given** migrations have already been applied, **When** the developer runs the migration
   command again, **Then** it completes idempotently with no errors.

---

### Edge Cases

- What happens when the PostgreSQL database is unreachable at startup or during use? The
  app displays a dismissible connectivity banner with a Retry action; navigation remains
  available but data may be stale.
- What happens when an environment variable holds an obviously malformed value (e.g., an
  empty string for the database URL)? The startup check should surface a specific message.
- What happens if a migration file is missing or corrupted locally? The migration tool
  should report exactly which file failed rather than silently leaving the schema partial.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST be bootstrapped with TypeScript strict mode enabled; plain
  JavaScript source files are not permitted.
- **FR-002**: The project MUST use Next.js (App Router) or Vite + React as the frontend
  framework with Tailwind CSS as the sole styling layer.
- **FR-003**: The project MUST use Prisma ORM for all database access and Auth.js (NextAuth)
  for authentication; no custom auth logic or additional backend server is introduced.
  (Replaces the original Supabase requirement — deviation approved in plan.md Complexity
  Tracking and research.md.)
- **FR-004**: The application MUST validate required environment variables at startup and
  surface a human-readable error listing any missing variables before attempting to render.
- **FR-005**: All protected application routes MUST redirect unauthenticated visitors to
  the sign-in page, preserving the originally requested URL for post-login redirect.
- **FR-006**: Authenticated users navigating to the sign-in page MUST be redirected to the
  authenticated home route. (Sign-up is out of scope for Phase 0; the route is excluded
  from the middleware matcher until a sign-up page is implemented.)
- **FR-007**: The database schema MUST be managed exclusively through versioned migration
  files; direct schema edits via the managed backend dashboard are prohibited.
- **FR-011**: The Phase 0 migration baseline MUST create all application tables in a single
  migration: `profiles`, `projects`, `tasks`, `project_members`, `comments`, `notifications`,
  and `tags`. Feature phases MUST NOT introduce new base tables; they MAY add columns,
  indexes, or constraints via additional migration files.
- **FR-012**: Row Level Security MUST be enabled on all seven tables (`profiles`, `projects`,
  `tasks`, `project_members`, `comments`, `notifications`, `tags`) in the Phase 0 migration.
  Initial policies MAY be permissive placeholders; feature phases MUST tighten them before
  exposing the table to end users.
- **FR-008**: TypeScript compilation MUST succeed with zero errors before the application
  starts or any pull request is merged.
- **FR-009**: The project MUST include a README with step-by-step local setup instructions
  covering dependency installation, environment variable setup, database migration, and
  starting the development server.
- **FR-010**: When the backend connection is unavailable, the application MUST display a
  dismissible banner warning the user of the connectivity issue. The banner MUST NOT block
  navigation; the user MAY continue browsing with the understanding that data shown may be
  stale. The banner MUST include a "Retry" action that re-checks the connection.

### Key Entities

- **User Session**: Represents the currently authenticated user; holds identity information
  (user ID, email, display name) obtained from the authentication service. Shared across
  all pages via a session context.
- **Route Guard**: A layout-level construct that enforces authentication rules for all
  child routes — redirecting unauthenticated users to sign-in and authenticated users away
  from public-only pages.
- **Environment Configuration**: The set of required runtime variables (backend URL, public
  API key, etc.) that must be present for the application to function. Validated at startup.
- **Migration Baseline**: The initial versioned migration file that creates the full
  application schema in Phase 0. Tables created: `profiles` (linked to auth users),
  `projects`, `tasks`, `project_members`, `comments`, `notifications`, `tags`. Subsequent
  phases add columns, constraints, or indexes but do not introduce new base tables.
- **Tag**: A plain text label that can be attached to a task for categorisation. Stored
  as a separate entity to allow reuse across tasks within a project.
- **Notification**: A record of an event (task assigned, `@mention` in a comment) directed
  at a specific user. Created server-side; read client-side to power the notification badge.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with no prior project knowledge can reach a running local instance
  in under 10 minutes by following the README alone.
- **SC-002**: The application starts up and renders the home page in under 3 seconds on a
  standard development machine with a stable internet connection.
- **SC-003**: 100% of protected routes redirect unauthenticated visitors without any
  unprotected content flashing before the redirect occurs.
- **SC-004**: Applying migrations to a blank database succeeds in a single command with
  zero manual steps.
- **SC-005**: TypeScript compilation produces zero errors and zero `any`-type suppressions
  in foundation-layer code.

## Clarifications

### Session 2026-11-17

- Q: Which database tables should the Phase 0 migration baseline create? → A: Full schema upfront — all tables (`profiles`, `projects`, `tasks`, `project_members`, `comments`, `notifications`, `tags`) created in Phase 0.
- Q: What should the placeholder home screen display after sign-in? → A: Welcome message only — a card showing the user's name and a backend "connected" status indicator; no navigation shell.
- Q: Which tables should have Row Level Security policies in Phase 0? → A: All seven tables — RLS enabled on every table in the Phase 0 migration; initial policies may be permissive placeholders.
- Q: What form should the backend-unavailable error state take? → A: Dismissible banner — warns user, allows continued navigation with potentially stale data, includes a Retry action.

## Assumptions

- The database is PostgreSQL managed via Prisma ORM; Auth.js (NextAuth) handles
  authentication. No Supabase service is used. This supersedes the original constitution
  preference for Supabase, as approved in the plan's Complexity Tracking section.
- The frontend framework is Next.js with the App Router; Vite + React is an acceptable
  fallback but routing and middleware behaviour described here assumes Next.js conventions.
- Phase 0 home screen is a welcome card (user name + backend connection status) only; no
  navigation shell or stub feature pages are introduced. The persistent app layout (header,
  sidebar, navigation links) is out of scope for Phase 0.
- Developers are assumed to have Node.js (LTS) and a package manager (npm/pnpm/yarn)
  already installed; the README need not cover these prerequisites.
- The project will be hosted on Vercel or Netlify; the foundation setup should not
  introduce any deployment artefacts incompatible with those platforms.
- Dark/light mode toggle and responsive layout are confirmed requirements but are not
  the primary concern of Phase 0; they are introduced in the Views phase.
