# Feature Specification: Authentication and Profile

**Feature Branch**: `002-auth-profile`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Read PLAN.md and create a specification for the phase Phase 1: Authentication and Profile ONLY."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New User Signs Up (Priority: P1)

A visitor who does not yet have an account fills in a sign-up form with their full name,
email address, and a password. The system validates the input and creates the account.
The user is immediately signed in and taken to the app home page.

**Why this priority**: Sign-up is the entry point for every new user. Without it, no
other authenticated feature is reachable by anyone who does not already have an account.

**Independent Test**: A new email address can be used to complete sign-up, and the
resulting account can then sign in independently — this fully validates the story.

**Acceptance Scenarios**:

1. **Given** a visitor on the sign-up page, **When** they submit a valid name, email, and
   password, **Then** their account is created, they are signed in, and they land on the
   Phase 0 welcome card screen (`/`) — the authenticated home page built in Phase 0.
2. **Given** a visitor submits an email that is already registered, **When** they submit
   the form, **Then** a clear error appears but it does NOT reveal whether that email is
   registered (generic "invalid input" or "try signing in instead" messaging only).
3. **Given** a visitor submits an email in an invalid format (e.g., missing `@`), **When**
   they submit, **Then** a field-level error explains the email must be a valid address.
4. **Given** a visitor submits a password shorter than the minimum length, **When** they
   submit, **Then** a field-level error states the minimum requirement.
5. **Given** a visitor submits a valid form, **When** the account is created, **Then** the
   password is never exposed in any response, URL, or log.

---

### User Story 2 - Existing User Signs In and Out (Priority: P1)

A registered user enters their email and password on the sign-in page. They are
authenticated and taken to the app home page. Their session persists across page reloads.
They can sign out at any time, after which they cannot access protected pages.

**Why this priority**: Sign-in and sign-out are the foundation of all authenticated
access. Every other feature depends on a working session.

**Independent Test**: Sign in with valid credentials → reload the page → still signed in
→ sign out → attempt to visit a protected page → redirected to sign-in.

**Acceptance Scenarios**:

1. **Given** a registered user on the sign-in page, **When** they enter correct credentials
   and submit, **Then** they are signed in and taken to the app home page.
2. **Given** a registered user submits incorrect credentials, **When** they submit,
   **Then** a general error message appears that does NOT indicate whether the email exists
   or the password was wrong specifically.
3. **Given** a signed-in user reloads any app page, **When** the page loads, **Then** they
   remain signed in and see their authenticated content.
4. **Given** a signed-in user clicks "Sign out", **When** sign-out completes, **Then** their
   session is cleared and they are taken to the sign-in page.
5. **Given** a signed-out user tries to open a protected page by URL, **When** the page
   loads, **Then** they are redirected to sign-in; after signing in they are taken to the
   page they originally requested.

---

### User Story 3 - User Views and Edits Their Profile (Priority: P2)

A signed-in user opens their profile page, where they see their current display name and
avatar representation. They can update their display name and avatar style/color and save
the changes. Updated information appears in the header immediately after saving.

**Why this priority**: Profile editing is a quality-of-life feature that makes the app
feel personal and complete, but the app works without it.

**Independent Test**: Navigate to the profile page, change the display name, save, and
confirm the new name appears in the header without a page reload.

**Acceptance Scenarios**:

1. **Given** a signed-in user opens the profile page, **When** the page loads, **Then**
   they see their current display name and avatar.
2. **Given** a user edits their display name and saves, **When** the save completes,
   **Then** the new name appears in the header user menu without a full page reload.
3. **Given** a user submits an empty display name, **When** they attempt to save, **Then**
   a validation error prevents the save and explains the field is required.
4. **Given** a user changes their avatar color or initials style, **When** they save,
   **Then** the new avatar is reflected in the header.

---

### User Story 4 - User Changes Their Password (Priority: P3)

A signed-in user can change their password from the profile page by supplying their
current password and a new password (confirmed twice). After a successful change, their
session remains active.

**Why this priority**: Password change is a security hygiene feature. It is lower priority
than core auth but important before the POC is shared with real users.

**Independent Test**: Change the password on the profile page, sign out, then sign in
with the new password successfully; verify the old password no longer works.

**Acceptance Scenarios**:

1. **Given** a signed-in user submits their current password and a valid new password,
   **When** they save, **Then** the password is updated and their session remains active.
2. **Given** a user enters the wrong current password, **When** they attempt to save,
   **Then** an error appears saying the current password is incorrect.
3. **Given** a user enters a new password that does not meet the minimum length requirement,
   **When** they attempt to save, **Then** a field-level error explains the requirement.
4. **Given** a user enters a new password and confirmation that do not match, **When** they
   attempt to save, **Then** a field-level error appears before the form is submitted.

---

### User Story 5 - User Menu in Header (Priority: P2)

A signed-in user sees a user menu in the app header showing their display name (or avatar
initials). Opening the menu reveals links to the Profile page and a Sign out action.

**Why this priority**: The user menu is the primary navigation hub for auth-related
actions. It makes the app feel complete and surfaces the profile link discovered in US3.

**Independent Test**: The header user menu is visible on every protected page, opens on
click, links to the profile page, and the sign-out link ends the session.

**Acceptance Scenarios**:

1. **Given** a signed-in user on any protected page, **When** they look at the header,
   **Then** they see their display name or avatar initials in the user menu area.
2. **Given** a user clicks the user menu, **When** it opens, **Then** they see at minimum
   a "Profile" link and a "Sign out" option.
3. **Given** a user clicks "Profile" from the menu, **When** the navigation completes,
   **Then** they land on the profile page.
4. **Given** a user clicks "Sign out" from the menu, **When** sign-out completes, **Then**
   their session is cleared and they are taken to the sign-in page.
5. **Given** a user updates their display name on the profile page, **When** they return
   to any protected page, **Then** the updated name is reflected in the header user menu.

---

### Edge Cases

- What happens when a sign-up or sign-in form is submitted while the server is unreachable?
  The form shows a generic connectivity error and remains interactive so the user can retry.
- What happens if a user opens two tabs, signs out in one, and then interacts in the other?
  The second tab should detect the session is gone on the next server interaction and
  redirect to sign-in.
- What happens if a password change request is submitted while the session expires?
  The user is redirected to sign-in and shown a message that they need to authenticate again.
- What happens when a user navigates directly to `/sign-up` or `/sign-in` while already
  signed in? They are redirected to the app home page.
- What happens if the same email is submitted twice in rapid succession on sign-up (double
  click)? Only one account should be created; duplicate submission is handled gracefully.
- What happens when a user exceeds the sign-in rate limit? They receive an error message
  instructing them to wait before retrying; the account itself is not locked.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-101**: The system MUST provide a sign-up form collecting full name, email address,
  and password. All three fields are required.
- **FR-102**: The system MUST reject sign-up submissions where the email address is not in
  a valid format, displaying a field-level error message.
- **FR-103**: The system MUST enforce a minimum password length of 8 characters on both
  sign-up and password change. The minimum requirement MUST be stated in the error message.
- **FR-104**: The system MUST reject sign-up submissions that use an already-registered
  email address, without revealing that the email is already in use. The error message
  MUST be generic (e.g., "Please check your details and try again").
- **FR-105**: Upon successful sign-up, the system MUST automatically sign the user in and
  redirect them to the authenticated home screen (`/`) — the Phase 0 welcome card page.
  Phase 2 will replace this with a workspace home when workspaces are introduced.
- **FR-106**: The system MUST provide a sign-in form accepting email and password.
- **FR-107**: Failed sign-in attempts MUST display a single generic error that does not
  distinguish between an unknown email and a wrong password.
- **FR-108**: A successful sign-in MUST establish a session that persists across page
  reloads and browser restarts (until the user explicitly signs out or the session expires).
- **FR-109**: The system MUST provide a sign-out action that clears the session and
  redirects the user to the sign-in page.
- **FR-110**: All routes under the authenticated section of the app MUST redirect
  unauthenticated visitors to the sign-in page, preserving the originally requested URL
  as a return destination after sign-in.
- **FR-111**: Authenticated users navigating to the sign-in or sign-up pages MUST be
  redirected to the app home page.
- **FR-112**: The system MUST provide a profile page where a signed-in user can view
  their current display name and avatar.
- **FR-113**: A user MUST be able to update their display name from the profile page.
  An empty display name MUST be rejected with a field-level error.
- **FR-114**: A user MUST be able to update their avatar initials and avatar color from the
  profile page. The color MUST be selected from a palette of exactly 8 preset colors.
  On account creation, the system MUST automatically assign one of the 8 colors; the user
  is not required to choose a color during sign-up.
- **FR-115**: Profile changes (display name, avatar) MUST be reflected in the header user
  menu immediately after saving, without a full page reload.
- **FR-116**: A user MUST be able to change their password from the profile page by
  supplying their current password and a new password (with confirmation). The current
  password MUST be verified before the change is applied.
- **FR-117**: The header MUST display a user menu for signed-in users, showing the user's
  display name or avatar initials. The menu MUST contain links to the Profile page and a
  Sign out action.
- **FR-118**: Passwords MUST NOT appear in any server response, application log, or URL
  at any point.
- **FR-119**: The sign-in endpoint MUST enforce a rate limit per IP address. A maximum of
  10 sign-in attempts per minute per IP is permitted. Requests that exceed this limit MUST
  receive a clear error message telling the user to wait before retrying. No account lockout
  is applied; rate limiting is IP-based only.

### Key Entities

- **User**: A registered person. Has an email address (unique, immutable after sign-up),
  a hashed password, and a creation timestamp.
- **Profile**: Extended display information for a user. Has a display name (required,
  max 100 characters), avatar initials (up to 2 characters, derived from display name by
  default but editable), and an avatar color (one of 8 preset colors; automatically
  assigned from the palette when the account is created; user can change it on the profile
  page).
- **Session**: An authenticated login context. Created on sign-in or sign-up; destroyed
  on sign-out or expiry. Persists across page reloads.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-101**: A new user can complete the full sign-up flow (form fill → account created →
  signed in → on home page) in under 60 seconds.
- **SC-102**: 100% of sign-in and sign-up error messages follow the non-disclosure rule —
  no message reveals whether a specific email address is registered in the system.
- **SC-103**: 100% of protected routes redirect unauthenticated visitors to sign-in,
  with the return URL preserved, and no protected content is visible before the redirect.
- **SC-104**: Profile changes (display name, avatar) are visible in the header within
  2 seconds of saving, without a full page reload.
- **SC-105**: A password change invalidates the old password — the user cannot sign in
  with the old password after a successful change.
- **SC-106**: The sign-up, sign-in, sign-out, and profile pages are fully operable using
  keyboard navigation alone, with a visible focus indicator on every interactive element.

## Clarifications

### Session 2026-11-18

- Q: Should the system limit failed sign-in attempts to protect against brute-force attacks? → A: Request-level rate limiting — max 10 sign-in attempts per minute per IP; no account lockout; exceeded limit returns a "wait before retrying" error.
- Q: How many colors in the avatar palette, and how is a color assigned? → A: 8 preset colors; system auto-assigns one on account creation; user can change it on the profile page; no color picker during sign-up.
- Q: Where does the user land after completing sign-up in Phase 1 (before workspaces exist)? → A: The Phase 0 welcome card screen (`/`); Phase 2 will replace it with a workspace home.

## Assumptions

- Sign-up with an external provider (Google, GitHub, SSO) is out of scope; email and
  password only, as stated in the global out-of-scope list in PLAN.md.
- Password reset ("forgot password") is not in scope for Phase 1; it can be added later.
  Users who forget their password cannot recover it in the POC.
- The session expiry period follows a reasonable default for web apps (e.g., 30 days of
  inactivity); the exact value is an implementation detail not requiring spec-level decision.
- Avatar representation uses initials (up to 2 characters) on a colored background chosen
  from a small palette. No image uploads are in scope.
- The minimum password length is 8 characters; no complexity rules (uppercase, special
  characters) are required beyond length.
- The profile page is accessible only to signed-in users. Viewing another user's profile
  is not in scope for Phase 1.
- Phase 0 (Foundation) MUST be complete before Phase 1 begins — the app shell, routing
  infrastructure, database connection, and session management primitives from Phase 0 are
  prerequisites for this phase.
- Display name defaults to the full name supplied at sign-up; the user can change it at
  any time from the profile page.
- The post-sign-up and post-sign-in redirect destination in Phase 1 is the Phase 0 welcome
  card screen (`/`). This is a temporary landing page; Phase 2 replaces it with a workspace
  home screen once workspaces are introduced.
