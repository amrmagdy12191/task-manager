<!--
SYNC IMPACT REPORT (remove before commit)
=========================================
Version change: 1.0.0 → 1.1.0
Modified principles:
  - I. Managed-Backend-First: replaced "Supabase preferred / no hand-rolled auth" with
    "Prisma ORM + Auth.js v5 as approved persistence and authentication stack"
Modified sections:
  - Tech Stack & Constraints: Supabase → Prisma 5 + Auth.js v5; @hello-pangea/dnd → dnd-kit
  - Dev Workflow: "Supabase migrations" → "prisma migrate dev"
Added sections: none
Removed sections: none
Follow-up TODOs: none — all placeholders resolved
Rationale for MINOR bump: material redefinition of approved stack within Principle I
  (the principle name and intent are unchanged; the mandated tooling is updated).
=========================================
-->

# TaskFlow Constitution

## Core Principles

### I. Managed-Persistence-First

All persistence and authentication MUST be implemented through Prisma ORM (PostgreSQL) and
Auth.js v5 (NextAuth) — the approved stack for this POC. No alternative ORM, raw SQL client,
or authentication library is permitted without an explicit constitution amendment.

Custom business logic (password hashing, server actions, rate limiting) is permitted and
expected within this stack. What is NOT permitted is introducing a second persistence layer,
a second auth library, or a managed BaaS (Supabase, Firebase, etc.) without amending this
constitution first.

**Rationale:** The POC goal is rapid validation using a well-understood, type-safe stack.
Prisma provides code-first schema management and type-safe queries; Auth.js v5 provides
session management with the PrismaAdapter. Keeping a single persistence layer avoids
operational complexity and data-sync issues.

### II. Minimal Scope (YAGNI)

Implementations MUST NOT exceed the POC scope defined in PLAN.md. Specifically:
- No OAuth social logins (Google/GitHub).
- No role-based permissions (Admin vs. Viewer) — all project members have equal edit access.
- No rich-text WYSIWYG editors; plain text or basic Markdown only.
- No email notifications or push alerts.
- No custom activity audit logs.

Any scope expansion MUST be explicitly approved and recorded as a constitution amendment before
implementation begins.

**Rationale:** Scope creep is the primary risk to a POC. Keeping scope fixed ensures the
prototype is shippable and validates only the intended hypotheses.

### III. Component Simplicity & Semantic HTML

UI components MUST use standard semantic HTML elements (`<button>`, `<dialog>`, `<input>`,
`<form>`) as the foundation. Custom components are permitted only when native elements cannot
meet the UX requirement. Tailwind CSS utility classes are the sole styling mechanism; no
additional CSS-in-JS libraries.

**Rationale:** Semantic HTML provides built-in keyboard navigation and accessibility at zero
cost. Keeping styling in Tailwind avoids a second styling system.

### IV. Client-Side-First Data Operations

Search and filtering MUST be implemented client-side where the dataset fits in memory (all
tasks for a project). Server-side filtering is only warranted when the task list exceeds a
threshold that makes client-side filtering noticeably slow (practical limit: >10,000 records).

**Rationale:** Client-side filtering eliminates round-trip latency and simplifies state
management for the POC scale.

### V. Accessibility & Responsive Layout

Every interactive element MUST be keyboard-navigable. The layout MUST render usably on
mobile-width viewports (≥375px) using CSS Grid/Flexbox. Overdue tasks (dueDate < today AND
status ≠ 'Done') MUST be visually distinguished (red due-date highlight). Dark/Light mode
toggle MUST be supported via Tailwind `dark:` classes, with preference persisted to
`localStorage`.

**Rationale:** Accessibility and responsiveness are non-negotiable UX quality bars, not
enhancements. The overdue highlight is a core product requirement from the plan.

## Tech Stack & Constraints

- **Frontend:** Next.js 14 (App Router) + TypeScript strict mode.
- **Styling:** Tailwind CSS only. No styled-components, Emotion, or CSS modules.
- **Drag-and-Drop:** `dnd-kit` (approved). `@hello-pangea/dnd` and native HTML5 drag-and-drop
  are NOT used — dnd-kit was selected in the Phase 0 research.
- **Backend/DB:** PostgreSQL via Prisma ORM 5 (code-first schema, `prisma migrate dev`).
- **Auth:** Auth.js v5 (NextAuth) with `@auth/prisma-adapter`. Credentials provider only
  (email + password). No social OAuth in the POC.
- **Hosting:** Vercel or Netlify (1-click deploy target).
- **State Management:** React built-ins (useState, useContext, useReducer) or a minimal
  library (Zustand). Redux is out of scope for the POC.

## Development Workflow

- Features MUST map 1-to-1 to the five scope areas in PLAN.md §2 (Auth, Workspaces,
  Tasks, Views, Search/Filter, Comments/Notifications).
- Each feature area MUST have a corresponding route or page-level component before
  sub-components are built.
- Database schema changes MUST be applied via `npx prisma migrate dev` (not direct table
  edits in any database client) so the schema is reproducible and version-controlled.
- Pull requests MUST include a brief description of which scope section is addressed.
- UI changes MUST be manually verified in both light and dark mode before merging.

## Governance

This constitution supersedes all other development guidelines for the TaskFlow POC. Any
practice not addressed here defaults to current React/Next.js community best practices.

**Amendment procedure:**
1. Propose the change in a PR description referencing the affected principle(s).
2. Obtain explicit approval from the project owner before merging.
3. Update `CONSTITUTION_VERSION` (MAJOR for principle removal/redefinition, MINOR for
   additions or material stack updates, PATCH for clarifications) and `LAST_AMENDED_DATE`
   in this file.

**Compliance:** All PRs must be reviewed against this constitution. A checklist item
"Verified against constitution" MUST appear in every PR that touches application code.

**Version**: 1.1.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-18
