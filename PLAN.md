# TaskFlow — POC Plan

## Overview

**TaskFlow** is a proof-of-concept collaborative task manager for the web. Small teams and individuals use it to organize work into workspaces, track tasks on a Kanban board or in a list, and work together through comments, mentions and notifications.

This plan is **technology-agnostic**. It describes *what* the product must do and *why*, not *how*. Technology choices will be made later, in `/speckit.plan`.

### How to use this plan

Each phase is meant to be specified on its own, in order:

```
/speckit-specify Read PLAN.md and create a specification for Phase N: <Phase Name> ONLY.
```

Finish each phase (specify → plan → tasks → implement) before you start the next one. Each phase builds on the one before it.

### POC principles

- **Simple over complete.** Build the smallest version that proves the concept. Leave out enterprise features.
- **Flat permissions.** Every member of a workspace can view and edit everything in it. There are no roles.
- **Demo-ready at every phase.** Each phase ends with something that runs and can be shown to someone.
- **Accessible and responsive by default.** All screens work with a keyboard and on mobile.

### Out of scope (for the whole POC)

- Role-based access control and granular permissions
- Billing, subscriptions and plan limits
- Email or push notifications (notifications are in-app only)
- Real-time live co-editing (refreshing or updating on navigation is enough)
- File attachments, subtasks, recurring tasks and time tracking
- Third-party integrations and a public API
- Sign-in with an outside provider (SSO or OAuth)

---

## Phase 0: Foundation and Architecture Page

### Goal
Set up the project skeleton, the shared layout and the design basics. Publish an in-app **Architecture page** that explains the system to anyone who reviews the POC.

### Scope
- **App shell:** a base layout with a header (app name, a placeholder for the user menu, and a theme toggle) and a main content area. The shell works at mobile, tablet and desktop widths.
- **Landing page (`/`):** a short description of TaskFlow, with links to the Architecture page and to sign-in (sign-in itself is built in Phase 1).
- **Architecture page (`/architecture`):** a public, read-only page with these sections:
  - **System overview:** the main parts of the system (client, server, data store, authentication) and how they talk to each other, ideally shown as a diagram.
  - **Data model:** the main entities and how they relate: User, Workspace, Membership, Invitation, Task, Tag, Comment, Mention and Notification.
  - **Key flows:** sign up and sign in, inviting a member, creating a task and moving it between statuses, and a mention that creates a notification.
  - **POC roadmap:** Phases 0 to 5, each with a one-line summary and a status (Planned, In Progress or Done).
  - **Non-goals:** the out-of-scope list above.
- **Theming basics:** light and dark mode. The theme follows the operating system setting by default, can be changed by hand, and the choice is remembered.
- **Quality basics:** linting and formatting, a unit test setup, an end-to-end test setup, and one smoke test that loads `/` and `/architecture`.
- **Environment basics:** example environment configuration, a README with setup and run steps, and a database that is connected but has no feature tables yet (or only placeholder ones).

### Acceptance criteria
- A developer can clone the repository, follow the README and run the app locally in under 10 minutes.
- `/architecture` shows every section listed above and is easy to read on a 375px-wide screen.
- The theme toggle switches between light and dark mode, and the choice is still there after a page reload.
- All interactive elements on `/` and `/architecture` can be reached and used with the keyboard and show a visible focus outline.
- The smoke tests pass.

---

## Phase 1: Authentication and Profile

### Goal
Let people create an account, sign in and manage a basic profile.

### Scope
- Sign up with name, email and password, with validation (correct email format, minimum password length, and no duplicate emails).
- Sign in and sign out with email and password. The session stays active across page reloads.
- Protected routes: signed-out users who open an app page are sent to sign-in, then back to where they were going.
- **Profile page:** view and edit display name and avatar initials or color, and change password.
- A user menu in the header shows the signed-in user and has links to Profile and Sign out.

### Acceptance criteria
- A new user can sign up, sign out and sign back in.
- Invalid credentials show a clear, general error message that doesn't say whether the email exists.
- Protected pages can't be opened without signing in.
- Profile changes show up straight away in the header.

---

## Phase 2: Workspaces and Members

### Goal
Let users put their work into separate workspaces (projects) and invite others to work with them.

### Scope
- Create a workspace with a name (for example "Work" or "Personal"). Every new user gets one default workspace.
- A **workspace switcher** in the header or sidebar. The last workspace the user picked is remembered.
- Rename a workspace, and delete it after a confirmation step.
- **Invite members by email:**
  - If the email belongs to an existing user, they are added (or get a pending invitation they can accept).
  - If the email is not registered, the invitation waits and is accepted automatically when that person signs up with the same email.
  - Invitations are shown in the app only; no email is sent in the POC.
- A members list shows each member's name, email, and whether they have joined or are still invited.
- A member can leave a workspace.
- **Flat permissions:** every member has the same full access.

### Acceptance criteria
- A user can create several workspaces and switch between them, and each one shows only its own data.
- An invited user who signs up or signs in sees the workspace and can open it.
- A user who is not a member can't see or open a workspace's data, even if they type its URL directly.

---

## Phase 3: Tasks

### Goal
Provide the core task management features inside a workspace.

### Scope
- Create, edit and delete tasks. Deleting asks for confirmation first.
- **Task fields:**
  - **Title** (required)
  - **Description:** plain text or Markdown, with a rendered preview
  - **Due date** (optional)
  - **Priority:** Low, Medium, High or Urgent (default Medium)
  - **Status:** To Do, In Progress, In Review or Done (default To Do)
  - **Tags:** free-text labels that belong to the workspace, with autocomplete from tags already used
  - **Assignee:** one workspace member, or nobody
- A task detail view, as a modal or a separate page, where every field can be edited.
- Created and updated timestamps, plus who created the task.
- **Overdue highlight:** a task with a due date in the past and a status other than Done is shown with a red highlight everywhere it appears.

### Acceptance criteria
- A member can create a task with every field filled in and see it saved correctly.
- Changes are visible to the other members of the workspace on their next load.
- Overdue tasks are highlighted in red. Tasks with status Done are never highlighted, even if their due date has passed.
- Markdown descriptions display safely, with no script injection.

---

## Phase 4: Views, Search and Filters

### Goal
Let users see and find their tasks in different ways.

### Scope
- **Kanban board view:** one column per status. Dragging a card to another column changes its status, and cards can be reordered within a column. Each card shows the title, priority, due date (with the overdue highlight), assignee and tags.
- **List view:** a table or list with sortable columns (title, status, priority, due date and assignee).
- **View toggle** between Board and List. The user's choice is remembered for each workspace.
- **Keyword search** that matches task titles and descriptions.
- **Filters:** status, priority, assignee (including "Unassigned" and "Me"), and overdue only. Filters can be combined with each other and with search. A "Clear filters" control resets them.
- Search and filter state is kept in the URL, so a filtered view can be shared or bookmarked.
- Empty states for "no tasks yet" and "no results".

### Acceptance criteria
- Dragging a card to a different column updates its status, and the change is still there after a page reload.
- Board and List views always show the same set of tasks for the same search and filters.
- Every board action has a way to do it without drag-and-drop (for example a status menu on each card).

---

## Phase 5: Collaboration and UX Polish

### Goal
Make TaskFlow feel collaborative and finished.

### Scope
- **Comments:** add, edit and delete your own comments on a task, shown in time order with the author and time.
- **`@mentions`:** typing `@` in a comment shows suggestions from the workspace members. A mention is highlighted in the comment that's displayed.
- **In-app notifications:**
  - These events create notifications: being mentioned, being assigned a task, and a new comment on a task assigned to you.
  - A bell icon shows the number of unread notifications. The list opens the related task, and notifications can be marked read one at a time or all at once.
- **Keyboard navigation:**
  - Shortcuts for common actions: create a task, focus search, toggle Board or List, and close dialogs with Esc.
  - A help overlay that lists the shortcuts, opened with `?`.
  - Arrow keys or Tab move between tasks and columns.
- **Mobile responsiveness pass:** the board scrolls sideways or stacks its columns, dialogs open full screen, and touch targets are at least 44px.
- **Dark/light mode pass:** every screen added in Phases 1 to 4 looks correct in both themes.
- Update the `/architecture` roadmap to show which phases are done.

### Acceptance criteria
- Mentioning a member creates exactly one notification for that member, and none for the author who mentioned them.
- A user can create a task, change its status and open notifications using only the keyboard.
- Every main screen can be used at 375px wide with no horizontal page scroll (the board itself may scroll sideways).
- Every screen meets WCAG AA color contrast in both themes.

---

## Core data model (reference)

| Entity | Key attributes | Relationships |
|---|---|---|
| User | id, name, email, password hash, avatar settings | has many Memberships, Comments, Notifications |
| Workspace | id, name, created by | has many Memberships, Invitations, Tasks, Tags |
| Membership | user, workspace, joined at | joins User ↔ Workspace |
| Invitation | workspace, email, invited by, status | belongs to Workspace |
| Task | title, description, due date, priority, status, position, assignee, creator, timestamps | belongs to Workspace; has many Tags, Comments |
| Tag | name | belongs to Workspace; many-to-many with Task |
| Comment | body, author, timestamps | belongs to Task; has many Mentions |
| Mention | mentioned user | belongs to Comment |
| Notification | recipient, type, related task or comment, read at | belongs to User |

## Roadmap summary

| Phase | Name | Outcome |
|---|---|---|
| 0 | Foundation and Architecture Page | Running app skeleton, theming, test setup, `/architecture` page |
| 1 | Authentication and Profile | Users can sign up, sign in and edit their profile |
| 2 | Workspaces and Members | Separate workspaces with members invited by email |
| 3 | Tasks | Full task create, read, update and delete with all fields and the overdue highlight |
| 4 | Views, Search and Filters | Kanban board with drag-and-drop, List view, search and filters |
| 5 | Collaboration and UX Polish | Comments, mentions, notifications, keyboard shortcuts, mobile and theme polish |
