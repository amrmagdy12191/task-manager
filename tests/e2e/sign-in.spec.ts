import { test, expect } from './fixtures'
import { logIn } from './helpers'

test('signs in, persists across reload and signs out from the header', async ({ page }) => {
  await page.goto('/sign-in')
  await logIn(page)
  await expect(page).toHaveURL('/')
  await page.reload()
  const header = page.getByRole('banner')
  await expect(header).toContainText('Alex Morgan')
  await header.getByRole('button', { name: 'User menu for Alex Morgan' }).click()
  await header.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/sign-in')
  await page.goto('/profile')
  await expect(page).toHaveURL('/sign-in?callbackUrl=%2Fprofile')
})

test('rejects wrong passwords without disclosing account details', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill('demo@taskflow.local')
  await page.getByLabel('Password', { exact: true }).fill('wrongpassword')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Invalid email or password.' })).toBeVisible()
})

test('limits the eleventh sign-in attempt for the same client', async ({ page }) => {
  await page.goto('/sign-in')
  await page.getByLabel('Email', { exact: true }).fill('nobody@example.test')
  await page.getByLabel('Password', { exact: true }).fill('wrongpassword')
  for (let attempt = 1; attempt <= 11; attempt++) {
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeEnabled()
    await expect(page.getByRole('alert').filter({ hasText: attempt <= 10 ? 'Invalid email or password.' : 'Too many sign-in attempts. Please wait a minute before trying again.' })).toBeVisible()
  }
})
