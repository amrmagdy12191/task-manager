# Contract: Auth Endpoints

**Feature**: 001-foundation-architecture
**Date**: 2026-11-17

Auth.js v5 exposes a catch-all route handler at `app/api/auth/[...nextauth]/route.ts`.
The routes below are managed by Auth.js — do not add custom logic inside the catch-all handler.

---

## Credentials sign-in through Auth.js

Use `signIn('credentials', { email, password, redirect: false })` from `next-auth/react`.
The helper obtains the CSRF token and submits a form-encoded POST to
`/api/auth/callback/credentials`. `/api/auth/signin` is the framework sign-in entry point,
not a custom JSON credentials endpoint.

**Request**
```
Content-Type: application/x-www-form-urlencoded
email=<email>&password=<password>&csrfToken=<Auth.js token>&callbackUrl=<local URL>
```

**Response**
- Successful helper result — session cookie set; the app navigates to its validated local callback URL.
- Failed helper result — `error` is populated and the form shows a generic invalid-credentials message.
- Auth.js owns HTTP redirect/error behavior; callers must inspect the helper result rather than assume HTTP status alone means authentication succeeded.

---

## POST /api/auth/signout

Terminates the current session.

**Request**: No body required (CSRF token handled by Auth.js)

**Response**: `200 OK` — session cookie cleared; redirect to sign-in page

---

## GET /api/auth/session

Returns the current session for the authenticated user.

**Response**
```json
{
  "user": {
    "id": "string",
    "name": "string | null",
    "email": "string",
    "image": "string | null"
  },
  "expires": "ISO 8601 datetime"
}
```
Returns `null` when no active session.

---

## GET /api/health

Lightweight liveness check used by the connectivity banner.

**Response**
- `200 OK` — `{ "status": "ok" }`
- `503 Service Unavailable` — database unreachable

**Notes**: Does not require authentication. Performs a minimal Prisma `$queryRaw SELECT 1`
to confirm the database connection is live.

---

## Route Protection Contract

Defined in `proxy.ts` (Next.js 16's middleware convention), with a second check in the
protected server layout and server actions. All application URLs except sign-in and the
public API endpoints require a session. Route group names do not appear in request URLs.
Sign-in redirects to app root if a session already exists. Sign-up is outside Phase 0.

| Route pattern | Auth required | Behaviour when rule violated |
|---|---|---|
| `/(protected)/*` | Yes | Redirect to `/sign-in?callbackUrl=<original>` |
| `/(auth)/*` | No (must be unauthenticated) | Redirect to `/` |
| `/api/auth/*` | No | Handled by Auth.js |
| `/api/health` | No | Public |
