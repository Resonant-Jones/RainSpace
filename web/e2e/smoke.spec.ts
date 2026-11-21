import { expect, test } from '@playwright/test'

/**
 * Browser verification of the primary demonstration path.
 *
 * These run against the production build (`npm run build && npm run preview`),
 * which is exactly what Netlify serves.
 */

test('primary navigation path: storefront to catalogue to content', async ({ page }) => {
  await page.goto('/')

  // The demo indicator is visible on the first screen.
  await expect(page.getByTestId('demo-banner')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Demo Creator', level: 1 })).toBeVisible()

  await page.getByRole('link', { name: 'Videos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Catalogue', level: 1 })).toBeVisible()

  // The catalogue shows published content only.
  await expect(page.getByRole('link', { name: /Night Bus: A Short Film/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Untitled Workshop Draft/ })).toHaveCount(0)

  await page.getByRole('link', { name: /Night Bus: A Short Film/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Night Bus: A Short Film', level: 1 }),
  ).toBeVisible()
})

test('filters change the catalogue without a backend', async ({ page }) => {
  await page.goto('/videos')

  await expect(page.getByText(/Showing 3 of 3 published items/)).toBeVisible()

  await page.getByRole('button', { name: 'Paid', exact: true }).click()
  await expect(page.getByText(/Showing 2 of 3 published items/)).toBeVisible()

  await page.getByRole('button', { name: 'Free', exact: true }).click()
  await expect(page.getByText(/Showing 1 of 3 published items/)).toBeVisible()

  // Clear the price filter first, so the search is measured on its own.
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(page.getByText(/Showing 3 of 3 published items/)).toBeVisible()

  await page.getByLabel('Search').fill('keyboard')
  await expect(page.getByText(/Showing 1 of 3 published items/)).toBeVisible()
  await expect(page.getByRole('link', { name: /Keyboard Mechanics/ })).toBeVisible()

  // A search with no match must explain itself rather than showing a blank grid.
  await page.getByLabel('Search').fill('zzz-no-such-item')
  await expect(page.getByText(/Nothing matches those filters/)).toBeVisible()
})

test('simulated sign-in, purchase and library flow', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByText(/no password field on purpose/i)).toBeVisible()
  await page.getByLabel('Display name').fill('Demo Fan')
  await page.getByRole('button', { name: /continue as demo fan/i }).click()

  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()
  await expect(page.getByText(/nothing here yet/i)).toBeVisible()

  await page.getByRole('link', { name: 'Videos', exact: true }).click()
  await page.getByRole('link', { name: /Night Bus: A Short Film/ }).click()

  await page.getByRole('button', { name: /simulate purchase/i }).click()
  await page.getByRole('button', { name: /confirm simulated purchase/i }).click()
  await expect(page.getByText(/in your library \(simulated\)/i)).toBeVisible()

  await page.getByRole('link', { name: 'Library', exact: true }).click()
  await expect(page.getByRole('link', { name: /Night Bus: A Short Film/ })).toBeVisible()
})

test('creator console is reachable by direct URL and marks its sample data', async ({ page }) => {
  // Direct navigation exercises the SPA route fallback.
  await page.goto('/admin/content')
  await expect(page.getByRole('heading', { name: 'Content', level: 1 })).toBeVisible()
  await expect(page.getByText(/demonstration only/i).first()).toBeVisible()

  await page.goto('/admin/schedule')
  await expect(page.getByRole('heading', { name: 'Schedule', level: 1 })).toBeVisible()
  await expect(page.getByTestId('calendar')).toBeVisible()

  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
  await expect(page.getByText(/sample data/i).first()).toBeVisible()
})

test('the storefront loads with no backend running', async ({ page }) => {
  await page.route('**/api/**', (route) => route.abort())

  await page.goto('/videos')
  await expect(page.getByRole('heading', { name: 'Catalogue', level: 1 })).toBeVisible()
  await expect(page.getByTestId('demo-banner')).toBeVisible()
})
