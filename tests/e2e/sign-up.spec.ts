import { test, expect } from './fixtures'
import { randomUUID } from 'node:crypto'

test('creates an account and automatically signs in', async ({ page }) => {
  await page.goto('/sign-up')
  await page.getByLabel('Name', { exact: true }).fill('E2E User')
  await page.getByLabel('Email', { exact: true }).fill(`signup-${randomUUID()}@example.test`)
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Welcome back, E2E User' })).toBeVisible()
})

test('shows field errors for invalid email and short password', async ({ page }) => {
  await page.goto('/sign-up')
  await page.getByLabel('Name', { exact: true }).fill('E2E User')
  await page.getByLabel('Email', { exact: true }).fill('notanemail')
  await page.getByLabel('Password', { exact: true }).fill('short')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page.getByText('Enter a valid email address.', { exact: true })).toBeVisible()
  await expect(page.getByText('Password must be at least 8 characters.', { exact: true })).toBeVisible()
  await expect(page).toHaveURL('/sign-up')
})

test('duplicate email returns only a generic error', async ({ page }) => {
  await page.goto('/sign-up')
  await page.getByLabel('Name', { exact: true }).fill('Duplicate User')
  await page.getByLabel('Email', { exact: true }).fill('demo@taskflow.local')
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  const alert = page.getByRole('alert').filter({ hasText: 'Please check your details and try again.' })
  await expect(alert).toBeVisible()
  await expect(alert).not.toContainText(/exists|registered/i)
})

test('a failed network request leaves the form usable for retry', async ({ page }) => {
  await page.goto('/sign-up')
  await page.getByLabel('Name', { exact: true }).fill('Offline Test')
  await page.getByLabel('Email', { exact: true }).fill(`offline-${randomUUID()}@example.test`)
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.route('**/sign-up', (route) => route.request().method() === 'POST' ? route.abort() : route.continue())
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Unable to connect.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create account', exact: true })).toBeEnabled()
  await page.unroute('**/sign-up')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page).toHaveURL('/')
})

test('sign-up is operable with only the keyboard and exposes no credentials', async ({ page }) => {
  const password = 'keyboard-pass-123'
  const responses: string[] = []
  const pendingResponses: Promise<void>[] = []
  page.on('response', (response) => {
    if (response.request().method() === 'POST') pendingResponses.push(response.text().then((text) => { responses.push(text) }).catch(() => {}))
  })
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Create an account' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/sign-up')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
  await expect(page.getByLabel('Name', { exact: true })).not.toHaveCSS('box-shadow', 'none')
  await page.keyboard.type('Keyboard User')
  await page.keyboard.press('Tab')
  await page.keyboard.type(`keyboard-${randomUUID()}@example.test`)
  await page.keyboard.press('Tab')
  await page.keyboard.type(password)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/')
  await Promise.all(pendingResponses)
  expect(responses.join('')).not.toContain(password)
  expect(responses.join('')).not.toMatch(/\$2[aby]\$12\$/)
  const session = await page.request.get('/api/auth/session')
  expect(await session.text()).not.toMatch(/password|\$2[aby]\$/i)
  expect(await page.content()).not.toContain(password)
})
