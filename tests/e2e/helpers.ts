import type { Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'

export async function createTestAccount(page: Page) {
  const account = { name: 'Profile Tester', email: `profile-${randomUUID()}@example.test`, password: 'password123' }
  await page.goto('/sign-up')
  await page.getByLabel('Name', { exact: true }).fill(account.name)
  await page.getByLabel('Email', { exact: true }).fill(account.email)
  await page.getByLabel('Password', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await page.waitForURL('/')
  return account
}

export async function signOutFromHeader(page: Page) {
  await page.getByRole('banner').getByRole('button', { name: /User menu for/ }).click()
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click()
  await page.waitForURL('/sign-in')
}

export async function logIn(page: Page) {
  const email = process.env.SEED_EMAIL
  const password = process.env.SEED_PASSWORD
  if (!email || !password) throw new Error('Set SEED_EMAIL and SEED_PASSWORD, then run npm run db:seed before E2E tests.')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}
