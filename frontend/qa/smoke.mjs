import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'qa/shots'
mkdirSync(OUT, { recursive: true })
const base = 'http://localhost:5173'

const shot = async (page, name) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  console.log('shot:', name)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

// Landing
await page.goto(base, { waitUntil: 'networkidle' })
await shot(page, '01-landing')

// Login as guest
await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
await shot(page, '02-login')
await page.getByRole('button', { name: /Guest/ }).first().click()
await page.getByRole('button', { name: 'Sign in', exact: true }).click()
await page.waitForURL(/\/book/, { timeout: 8000 })
await page.waitForLoadState('networkidle')
await shot(page, '03-book-guest')

// Pick a free slot and confirm
const freeSlot = page.locator('button[aria-label*="available"]').first()
await freeSlot.click()
await page.waitForTimeout(300)
await shot(page, '04-book-selected')
await page.getByRole('button', { name: /Confirm reservation/ }).click()
await page.waitForTimeout(700)
await shot(page, '05-book-confirmed')

// My reservations
await page.getByRole('link', { name: /My reservations/ }).first().click()
await page.waitForURL(/\/reservations/)
await page.waitForLoadState('networkidle')
await shot(page, '06-my-reservations')

// Sign out, then admin
await page.getByRole('button', { name: 'Sign out' }).click().catch(() => {})
await page.waitForURL(/\/login/, { timeout: 8000 }).catch(() => {})
await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /admin/ }).first().click()
await page.getByRole('button', { name: 'Sign in', exact: true }).click()
await page.waitForURL(/\/admin/, { timeout: 8000 })
await page.waitForLoadState('networkidle')
await shot(page, '07-admin-book')

// Admin tables
await page.getByRole('link', { name: /Tables/ }).first().click()
await page.waitForURL(/\/admin\/tables/)
await page.waitForLoadState('networkidle')
await shot(page, '08-admin-tables')

// Mobile view of booking
const m = await ctx.newPage()
await m.setViewportSize({ width: 390, height: 844 })
await m.goto(`${base}/login`, { waitUntil: 'networkidle' })
await m.getByRole('button', { name: /Guest/ }).first().click()
await m.getByRole('button', { name: 'Sign in', exact: true }).click()
await m.waitForURL(/\/book/, { timeout: 8000 })
await m.waitForLoadState('networkidle')
await m.screenshot({ path: `${OUT}/09-book-mobile.png`, fullPage: true })
console.log('shot: 09-book-mobile')

console.log('\nconsole errors:', errors.length ? errors : 'none')
await browser.close()
