import { chromium } from 'playwright'

const base = 'http://localhost:5173'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const logs = []
page.on('console', (m) => m.type() === 'error' && logs.push(`[error] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.stack || e}`))

await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /admin/ }).first().click()
await page.getByRole('button', { name: 'Sign in', exact: true }).click()
await page.waitForURL(/\/admin/, { timeout: 8000 })
await page.waitForTimeout(1500)
console.log('URL:', page.url())
console.log('heading:', await page.locator('h1').first().innerText().catch(() => 'NONE'))
console.log('errors:', logs.join('\n') || 'none')
await page.screenshot({ path: 'qa/shots/diag-admin.png', fullPage: true })
await browser.close()
