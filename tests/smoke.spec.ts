import { test, expect } from '@playwright/test'

test.describe('026news smoke', () => {
  test('homepage loads', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
  })

  test('login page is reachable and renders the sign-in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('signup page shows reader/journalist toggle', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('tab', { name: 'Reader' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Journalist' })).toBeVisible()
  })

  test('profile redirects to login when signed out', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/)
  })
})
