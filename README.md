# TaskFlow

A task-management foundation built with Next.js 16 App Router, strict TypeScript,
Tailwind CSS 3, PostgreSQL, Prisma 5, and Auth.js v5. Phase 0 includes sign-in,
route protection, a welcome card, connection monitoring, and the complete baseline schema.
Task boards, sign-up, and other feature screens are intentionally deferred.

## Quick local demo — no database required

Requirements: Node.js 22 LTS or newer and npm 10+.

```bash
npm ci
cp .env.local.example .env.local
openssl rand -base64 32
```

Paste the generated value into `NEXTAUTH_SECRET` in `.env.local`, keep
`DATA_SOURCE=demo`, and start with `npm run dev`. No PostgreSQL service, database URL,
migration, or seed command is needed. If `.env.local` already exists, update its values
instead of copying over it.

Open [localhost:3000](http://localhost:3000) and sign in:

| Email | Password |
|---|---|
| `demo@taskflow.local` | `TaskFlowDemo123!` |

Saved dummy data: [data/demo-data.json](data/demo-data.json). Additional accounts and
fixture details: [data/README.md](data/README.md). It includes users, projects, tasks,
comments, notifications, and tags. The current welcome screen uses the selected user's
profile; board screens and UI data editing remain future features. Editing the JSON
changes the saved fixture and takes effect on refresh.

`DATA_SOURCE` selects the backend explicitly. Demo mode reads the fixture from disk;
PostgreSQL mode uses Prisma. It never silently falls back to dummy data if a real database fails.

## PostgreSQL setup (optional)

Requirements: Node.js 22 LTS or newer, npm 10+, and PostgreSQL 15+.

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create local configuration:

   ```bash
   cp .env.local.example .env.local
   openssl rand -base64 32
   ```

   Set `DATA_SOURCE=postgres`, uncomment and set `DATABASE_URL` to an existing PostgreSQL database, paste the generated secret into
   `NEXTAUTH_SECRET`, and set `NEXTAUTH_URL=http://localhost:3000`.
   `.env.local` is ignored by Git. Never commit credentials.

   If you need a local database and have Docker:

   ```bash
   docker run -d --name taskflow-postgres \
     -e POSTGRES_USER=taskflow -e POSTGRES_PASSWORD=taskflow-local-only \
     -e POSTGRES_DB=taskflow -p 127.0.0.1:54329:5432 \
     -v taskflow-postgres-data:/var/lib/postgresql/data postgres:16-alpine
   ```

   Use `postgresql://taskflow:taskflow-local-only@localhost:54329/taskflow?connect_timeout=3&pool_timeout=3`
   for this local container. These example credentials are for local development only.

3. Generate the Prisma client and apply migrations:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

   The checked-in `0001_baseline` migration creates all 12 models. Repeating the migration
   command is a no-op when the schema is current. The npm wrappers load `.env.local`;
   bare Prisma 5 CLI commands do not. Use `npm run db:deploy` to apply existing migrations
   in deployment environments; never use schema push as a replacement for migrations.

4. Set `SEED_EMAIL`, `SEED_PASSWORD` (12–72 characters), and `SEED_NAME` in `.env.local`, then:

   ```bash
   npm run db:seed
   ```

   This explicitly creates or updates one development account and its bcrypt password hash.
   It never runs automatically and refuses to run with `NODE_ENV=production`. Sign-up is
   outside Phase 0, so use this account to validate sign-in.

5. Start the app:

   ```bash
   npm run dev
   ```

   Open [localhost:3000](http://localhost:3000) and sign in using your seed credentials.
   The startup command validates environment variables and TypeScript before starting Next.js.
   A disconnected database produces a dismissible warning with Retry; an existing session
   can still render the welcome screen and sign out. Database reads have a two-second
   response deadline so a stalled connection cannot hold the welcome screen indefinitely.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Validate configuration/types and start development server |
| `npm run build` / `npm start` | Build and serve production output |
| `npm run typecheck` | Check strict TypeScript |
| `npm run lint` | Check source with ESLint |
| `npm test` / `npm run test:run` | Watch unit tests / run once |
| `npm run test:db` | Verify schema and row isolation using temporary local database fixtures |
| `npm run test:e2e` | Run Chromium browser tests against the local app |
| `npm run test:e2e:ui` | Open Playwright's test runner |
| `npm run db:migrate` | Apply migrations and generate new migrations for schema changes |
| `npm run db:deploy` | Apply checked-in migrations only |
| `npm run db:generate` | Regenerate Prisma types/client |
| `npm run db:seed` | Create/update the explicit local development account |
| `npm run db:studio` | Inspect the local database |

In demo mode the checked-in accounts work immediately. For PostgreSQL mode, first migrate
and seed the database. Install the browser once, then run the tests:

```bash
npm exec playwright install chromium
npm run test:run
npm run test:e2e
```

Browser tests use `SEED_*` values matching the selected data source (the example file
already matches the main demo account). They perform real
logins; no session forgery or skipped login assertions are used. By default Playwright
starts the app, or reuses an existing local server on port 3000. In CI it starts its own.

## Architecture and boundaries

```text
app/(auth)/             Public sign-in page
app/(protected)/        Guarded welcome page and layout
app/api/                Auth.js handlers and uncached database health endpoint
components/             Session/connectivity providers and semantic UI components
lib/                    Typed configuration, authentication, scoped data access, actions
prisma/                 Schema and versioned migration baseline
data/                   Saved local demo fixture and published demo credentials
scripts/                Environment-aware Prisma runner and explicit local seed
tests/                  Unit/component and real-browser tests
proxy.ts                Pre-render session redirect (Next.js 16 middleware convention)
```

Auth.js manages JWT sessions and CSRF protections; credentials are verified with bcrypt.
The `Profile.passwordHash` field is never included in session or public profile responses.
All application actions authenticate again on the server. Return URLs are restricted to
local application paths and retain query strings. `/api/health` is deliberately public:
it validates fixture readability in demo mode or executes `SELECT 1` in PostgreSQL mode.

The approved plan uses application authorization rather than native PostgreSQL RLS.
`withAccessControl(userId)` scopes reads across Profile, Project, ProjectMember, Task,
Comment, Notification, Tag, and TaskTag. It rejects raw queries, auth-table access,
relation includes, and writes. New feature writes and relation reads require explicit
resource policies before exposure; the unscoped `db` client is reserved for Auth.js,
health checks and maintenance scripts. No task-management API is exposed yet.

Theme initialization honors a saved light/dark preference or the system preference.
The theme toggle belongs to the later Views phase. Styling works from 375px upward.

The original Next.js 14 scaffold was upgraded to patched Next.js 16 with user approval
after dependency auditing. The adapted tasks and verification evidence are recorded in
[the foundation task list](specs/001-foundation-architecture/tasks.md).

## Phase branches and GitHub approval

Repository: [amrmagdy12191/task-manager](https://github.com/amrmagdy12191/task-manager).
Each product phase in `PLAN.md` has a local branch. The numeric prefixes follow the
existing spec-kit feature naming convention; branch `001` corresponds to Phase 0.

| Product phase | Local branch |
|---|---|
| 0 — Foundation and Architecture Page | `001-foundation-architecture` |
| 1 — Authentication and Profile | `002-authentication-profile` |
| 2 — Workspaces and Members | `003-workspaces-members` |
| 3 — Tasks | `004-tasks` |
| 4 — Views, Search and Filters | `005-views-search-filters` |
| 5 — Collaboration and UX Polish | `006-collaboration-ux-polish` |

Branches were initially reserved at the current `main` commit. Before implementing a
later phase, bring the completed preceding phase into its branch with a reviewed local
merge so it builds on the foundation. Uncommitted files remain in the shared working tree;
creating branches alone does not save separate snapshots of those files.

**Push approval is required:** prepare and review each phase locally, then get explicit
user approval before pushing its branch to GitHub. No branches are published automatically.
