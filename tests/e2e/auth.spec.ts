import { test, expect } from './fixtures'
import { logIn } from './helpers'

test.describe('Authentication flows', () => {
  test('unauthenticated user redirects without receiving protected content', async ({ page, request }) => {
    const response = await request.get('/', { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(response.headers().location).toBe('/sign-in?callbackUrl=%2F')
    expect(await response.text()).not.toContain('Welcome back')
    await page.goto('/')
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2F$/)
    await expect(page.getByRole('heading', { name: 'Sign in to TaskFlow' })).toBeVisible()
  })

  test('sign-in page is accessible and incorrect credentials are rejected', async ({ page }) => {
    await page.goto('/sign-in')
    await page.getByLabel('Email', { exact: true }).fill(process.env.SEED_EMAIL ?? 'developer@example.com')
    await page.getByLabel('Password', { exact: true }).fill('not-the-correct-password')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Invalid email or password.' })).toBeVisible()
    await expect(page).toHaveURL(/\/sign-in$/)
  })

  test('real sign-in shows the welcome card and keeps the session on reload', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/sign-in')
    await logIn(page)
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: `Welcome back, ${process.env.SEED_NAME ?? 'Local Developer'}` })).toBeVisible()
    await expect(page.getByText('Connected', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('authenticated user is redirected away from sign-in', async ({ page }) => {
    await page.goto('/sign-in')
    await logIn(page)
    await expect(page).toHaveURL('/')
    await page.goto('/sign-in')
    await expect(page).toHaveURL('/')
    await page.goto('/sign-up')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible()
  })

  test('callbackUrl preserves the path and query through sign-in', async ({ page }) => {
    await page.goto('/?view=board&filter=mine')
    expect(new URL(page.url()).searchParams.get('callbackUrl')).toBe('/?view=board&filter=mine')
    await logIn(page)
    await expect(page).toHaveURL('/?view=board&filter=mine')
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible()
  })

  test('unknown protected routes retain their requested destination', async ({ page }) => {
    await page.goto('/board?filter=mine')
    expect(new URL(page.url()).searchParams.get('callbackUrl')).toBe('/board?filter=mine')
    await logIn(page)
    await expect(page).toHaveURL('/board?filter=mine')
    // Phase 0 has no board page; this asserts the return URL without adding feature UI.
    await expect(page.getByText('This page could not be found.')).toBeVisible()
  })

  test('external callback URLs cannot redirect the browser off site', async ({ page }) => {
    await page.goto('/sign-in?callbackUrl=https%3A%2F%2Fexample.com')
    await logIn(page)
    await expect(page).toHaveURL('/')
  })

  test('sign-out clears the session and protects subsequent requests', async ({ page }) => {
    await page.goto('/sign-in')
    await logIn(page)
    await expect(page).toHaveURL('/')
    await page.getByRole('button', { name: 'Sign out', exact: true }).click()
    await expect(page).toHaveURL(/\/sign-in$/)
    const response = await page.request.get('/api/auth/session')
    expect(await response.json()).toBeNull()
    await page.goto('/')
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=/)
  })

  test('a forged session cookie is rejected', async ({ page, context }) => {
    await context.addCookies([{ name: 'authjs.session-token', value: 'forged', domain: 'localhost', path: '/' }])
    await page.goto('/')
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
