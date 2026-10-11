import fs from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:5199'
const OUT_DIR = 'docs/screenshots'

// Prefer an explicit browser if provided; otherwise fall back to the bundled
// engine path when present (the headless shell fails to spawn on this machine),
// and finally let Playwright pick its own default.
const CHROME_EXE =
  process.env.CHROME_EXE ||
  'C:\\Users\\admin\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe'

const launchOpts = {}
if (fs.existsSync(CHROME_EXE)) launchOpts.executablePath = CHROME_EXE

const browser = await chromium.launch(launchOpts)
const page = await browser.newPage()

const consoleMsgs = []
const pageErrors = []
const failedRequests = []
const badResponses = []

page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => pageErrors.push(String(err)))
page.on('requestfailed', (req) =>
  failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText}`),
)
page.on('response', (res) => {
  if (res.status() >= 400) {
    badResponses.push(`${res.status()} ${res.request().method()} ${res.url()}`)
  }
  if (res.status() === 404) console.log(`   [debug] 404 response for: ${res.url()}`)
})

const steps = []
async function step(name, fn) {
  try {
    await fn()
    steps.push(`PASS ${name}`)
  } catch (e) {
    steps.push(`FAIL ${name}: ${e.message}`)
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true })

await step('goto /login', async () => {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
})
await step('click "Login as Admin"', async () => {
  await page.getByRole('button', { name: 'Login as Admin' }).click()
  await page.waitForURL('**/analytics', { timeout: 8000 })
})
await step('reach /analytics', async () => {
  await page.getByRole('heading', { name: 'Admin Analytics' }).waitFor({ timeout: 8000 })
})
await step('stat cards render', async () => {
  await page.getByText('Current occupancy %').first().waitFor({ timeout: 8000 })
  await page.getByText('Patients waiting now').first().waitFor({ timeout: 8000 })
})
await step('charts render (recharts)', async () => {
  await page.locator('.recharts-wrapper').first().waitFor({ timeout: 10000 })
})
await step('heatmap renders', async () => {
  await page.locator('.hs-heatmap').first().waitFor({ timeout: 8000 })
  await page.getByText('General B').first().waitFor({ timeout: 8000 })
})
await step('save screenshot 08-admin-analytics.png', async () => {
  await page.screenshot({ path: `${OUT_DIR}/08-admin-analytics.png`, fullPage: false })
})

console.log('URL at end:', page.url())
console.log('--- steps ---')
for (const s of steps) console.log(' ', s)

console.log('--- console messages ---')
for (const m of consoleMsgs) console.log(' ', m)
console.log('console [error] count:', consoleMsgs.filter((m) => m.startsWith('[error]')).length)

console.log('--- page errors ---')
for (const e of pageErrors) console.log(' ', e)
console.log('page error count:', pageErrors.length)

console.log('--- failed (blocked/aborted) requests ---')
for (const f of failedRequests) console.log(' ', f)
console.log('failed request count:', failedRequests.length)

console.log('--- responses with status >= 400 ---')
for (const b of badResponses) console.log(' ', b)
console.log('bad response count:', badResponses.length)

const rendered = steps[3]?.startsWith('PASS') && steps[4]?.startsWith('PASS')
console.log('RESULT analytics rendered =', Boolean(rendered))
console.log('RESULT zero console errors =', consoleMsgs.filter((m) => m.startsWith('[error]')).length === 0)
console.log('RESULT zero page errors =', pageErrors.length === 0)
console.log(
  'RESULT zero failed requests =',
  failedRequests.length === 0 && badResponses.length === 0,
)

await browser.close()