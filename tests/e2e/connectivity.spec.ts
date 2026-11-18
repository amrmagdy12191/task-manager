import { test, expect } from './fixtures'
import { logIn } from './helpers'

test('connection warning recovers on Retry and can be dismissed without blocking sign-out', async ({ page }, testInfo) => {
  let healthy = false
  await page.route('**/api/health', (route) => route.fulfill({
    status: healthy ? 200 : 503,
    contentType: 'application/json',
    body: JSON.stringify({ status: healthy ? 'ok' : 'error' }),
  }))
  await page.goto('/sign-in')
  await logIn(page)
  const warning = page.getByRole('alert').filter({ hasText: 'Unable to reach the server' })
  await expect(warning).toBeVisible()
  await expect(page.getByText('Disconnected', { exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('connectivity-warning.png'), fullPage: true })
  healthy = true
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(warning).not.toBeVisible()
  await expect(page.getByText('Connected', { exact: true })).toBeVisible()
  healthy = false
  await page.reload()
  await expect(warning).toBeVisible()
  await page.getByRole('button', { name: 'Dismiss connectivity warning' }).click()
  await expect(warning).not.toBeVisible()
  await expect(page.getByText('Disconnected', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page).toHaveURL(/\/sign-in$/)
})

for (const theme of ['light', 'dark'] as const) {
  for (const width of [375, 1280]) {
    test(`${theme} screens fit a ${width}px viewport`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 812 })
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto('/sign-up')
      await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath('sign-up.png'), fullPage: true })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.goto('/sign-in')
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /dark/ : /^$/)
      await expect(page.getByRole('heading', { name: 'Sign in to TaskFlow' })).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath('sign-in.png'), fullPage: true })
      await page.getByLabel('Email', { exact: true }).focus()
      await expect(page.getByLabel('Email', { exact: true })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Password', { exact: true })).toBeFocused()
      await logIn(page)
      await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible()
      await expect(page.getByText('Connected', { exact: true })).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath('welcome.png'), fullPage: true })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.goto('/profile')
      await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath('profile.png'), fullPage: true })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  }
}
