# Contract: Auth Endpoints — Phase 1

**Feature**: 002-auth-profile
**Date**: 2026-11-18

Extends the Phase 0 auth endpoint contract. Auth.js still manages the catch-all handler
at `app/api/auth/[...nextauth]/route.ts`. This phase wires real bcrypt credential
verification and adds the sign-up Server Action.

---

## Sign-Up (Server Action: `signUpAction`)

Not an HTTP endpoint — called directly from `SignUpForm` as a Next.js Server Action.

**Input** (Zod-validated):
```ts
{
  name: string,      // required; min 1 char; max 100 chars
  email: string,     // required; valid email format
  password: string,  // required; min 8 chars
}
```

**Success flow**:
1. Validate input with Zod → return `VALIDATION_ERROR` on failure
2. Check for duplicate email → return generic error (never reveal existence)
3. Hash password with bcrypt (cost 12)
4. Create `User` + `Profile` in a Prisma transaction
5. Call `signIn('credentials', { email, password, redirect: false })`
6. Redirect to `/`

**Error responses** (`ActionResult<never>`):
| Code | Message shown to user |
|---|---|
| `VALIDATION_ERROR` | Field-level error (email format, password length) |
| `SIGN_UP_FAILED` | "Please check your details and try again." (covers duplicate email) |
| `DB_ERROR` | "Something went wrong. Please try again." |

---

## Sign-In (Auth.js Credentials Provider)

Triggered by `signIn('credentials', { email, password, redirect: false })` from
`SignInForm`. The credential `authorize()` function in `lib/auth.ts`:

1. Checks rate limit via `lib/rate-limit.ts` — rejects with `RATE_LIMITED` if exceeded
2. Looks up `User` by email (no error revealed if not found)
3. Compares password with `bcryptjs.compare`
4. Returns the `User` object on success, `null` on failure

**Rate limit** (FR-119):
- 10 sign-in attempts per minute per IP
- Exceeded: HTTP 429-equivalent; message: "Too many sign-in attempts. Please wait a minute before trying again."

**Failed sign-in**: Auth.js returns `{ error: 'CredentialsSignin' }`; `SignInForm` maps
this to: "Invalid email or password." (never distinguishes email-not-found from wrong password — FR-107)

---

## Sign-Out (Server Action: `signOutAction`)

Defined in `lib/actions/auth.ts` (Phase 0). No changes in Phase 1.

**Behaviour**: Clears session; redirects to `/sign-in`.

---

## GET /api/health

Unchanged from Phase 0. No auth required.

---

## Route Protection Contract

Unchanged from Phase 0, with one addition: `/sign-up` is now a real page and is
treated as an auth-only route (authenticated users are redirected to `/`).

| Route pattern | Auth required | Behaviour when rule violated |
|---|---|---|
| `/(protected)/*` | Yes | Redirect to `/sign-in?callbackUrl=<original>` |
| `/sign-in` | No (unauthenticated only) | Redirect to `/` |
| `/sign-up` | No (unauthenticated only) | Redirect to `/` |
| `/api/auth/*` | No | Handled by Auth.js |
| `/api/health` | No | Public |

**Middleware update**: `middleware.ts` must add `/sign-up` to the `isAuthRoute` check
(reverted from the Phase 0 scope-out; sign-up page now exists).
