import { chromium } from 'playwright'

const base = 'http://localhost:5173'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto(`${base}/register`, { waitUntil: 'networkidle' })
await page.getByLabel('Full name').fill('Sneaky Sam')
await page.getByLabel('Email').fill(`sneaky_${Date.now().toString(36)}@test.com`)
await page.getByLabel('Password').fill('secret1')
await page.getByRole('button', { name: /Have a staff access code/ }).click()
await page.getByLabel('Access code').fill('WRONG-CODE')
await page.getByRole('button', { name: 'Create account' }).click()
await page.waitForTimeout(1000)

const toast = await page.getByText(/Invalid access code/).count()
const stillOnRegister = page.url().includes('/register')
console.log('URL:', page.url())
console.log('“Invalid access code” shown:', toast > 0)
console.log('stayed on register (no auto guest login):', stillOnRegister)
await page.screenshot({ path: 'qa/shots/code-invalid.png', fullPage: true })
await browser.close()
