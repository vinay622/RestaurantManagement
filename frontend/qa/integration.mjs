// Drive the REAL backend (port 4000) through the browser on 5174.
// Proves the frontend↔backend contract end-to-end over HTTP.
import { chromium } from 'playwright'

const base = 'http://localhost:5174'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
// Confirm requests actually hit :4000
let hitApi = 0
page.on('request', (r) => r.url().includes(':4000/api/v1') && hitApi++)

const fail = []
const ok = (n, c) => (c ? console.log(`  ✔ ${n}`) : (fail.push(n), console.log(`  ✗ ${n}`)))

// Register a fresh guest against the live API
const email = `guest_${Date.now().toString(36)}@test.com`
await page.goto(`${base}/register`, { waitUntil: 'networkidle' })
await page.getByLabel('Full name').fill('Test Guest')
await page.getByLabel('Email').fill(email)
await page.getByLabel('Password').fill('secret1')
await page.getByRole('button', { name: 'Create account' }).click()
await page.waitForURL(/\/book/, { timeout: 10000 })
await page.waitForLoadState('networkidle')
ok('register → lands on /book against live API', page.url().includes('/book'))
ok('booking board loaded tables from API', (await page.locator('button[aria-label*="available"]').count()) > 0)

// Book a slot
await page.locator('button[aria-label*="available"]').first().click()
await page.getByRole('button', { name: /Confirm reservation/ }).click()
await page.waitForTimeout(900)
ok('confirmation toast shown', await page.getByText(/is yours —/).isVisible().catch(() => false))

// Verify it persisted via My Reservations (fresh GET from API)
await page.getByRole('link', { name: /My reservations/ }).first().click()
await page.waitForURL(/\/reservations/)
await page.waitForLoadState('networkidle')
ok('reservation persisted & fetched from API', await page.getByText(/Confirmed/i).first().isVisible().catch(() => false))
await page.screenshot({ path: 'qa/shots/int-guest-reservations.png', fullPage: true })

// Admin path against live API
await page.getByRole('button', { name: 'Sign out' }).click().catch(() => {})
await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
await page.getByLabel('Email').fill('admin@maison.test')
await page.getByLabel('Password').fill('password')
await page.getByRole('button', { name: 'Sign in', exact: true }).click()
await page.waitForURL(/\/admin/, { timeout: 10000 })
await page.waitForTimeout(1200)
ok('admin signs in against live API', page.url().includes('/admin'))
ok('admin sees a reservation in the book', await page.getByText(/Test Guest/).first().isVisible().catch(() => false))
await page.screenshot({ path: 'qa/shots/int-admin.png', fullPage: true })

console.log(`\nAPI requests to :4000 → ${hitApi}`)
console.log('console errors:', errors.length ? errors : 'none')
console.log(fail.length ? `\nFAILED: ${fail.join(', ')}` : '\nALL INTEGRATION CHECKS PASSED')
await browser.close()
process.exit(fail.length ? 1 : 0)
