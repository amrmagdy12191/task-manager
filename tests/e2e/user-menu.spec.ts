import { test, expect } from './fixtures'
import { logIn } from './helpers'

test('header menu supports keyboard profile navigation and sign-out', async ({ page }) => {
  await page.goto('/sign-in')
  await logIn(page)
  const header = page.getByRole('banner')
  await expect(header).toBeVisible()
  const trigger = header.getByRole('button', { name: 'User menu for Alex Morgan' })
  await trigger.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menu')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/profile')
  await trigger.click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/sign-in')
})
