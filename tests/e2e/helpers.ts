import type { Page } from '@playwright/test'

export async function logIn(page: Page) {
  const email = process.env.SEED_EMAIL
  const password = process.env.SEED_PASSWORD
  if (!email || !password) throw new Error('Set SEED_EMAIL and SEED_PASSWORD, then run npm run db:seed before E2E tests.')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}
