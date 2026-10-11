// Responsive + console-error checker (Step 8).
//
// Boots an ephemeral Vite dev server on port 5199 (--strictPort), then uses
// Playwright Chromium to log in as each role, visit that role's pages at three
// widths (390 / 768 / 1280) and report:
//   - any page where document.documentElement.scrollWidth > clientWidth
//   - any console errors / page errors
// The dev server and browser are always torn down before exit.
//
// Run: node scripts/check-responsive.mjs

import fs from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const VITE_BIN = resolve(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
const PORT = 5199
const BASE = `http://localhost:${PORT}`
const WIDTHS = [390, 768, 1280]

const CHROME_EXE =
  process.env.CHROME_EXE ||
  'C:\\Users\\admin\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe'

const ROLES = [
  { role: 'nurse', button: 'Login as Nurse', pages: ['/dashboard', '/intake'] },
  { role: 'doctor', button: 'Login as Doctor', pages: ['/queue'] },
  { role: 'admin', button: 'Login as Admin', pages: ['/analytics', '/dashboard', '/queue', '/intake'] },
]

const PUBLIC_PAGES = ['/login', '/definitely-not-a-real-page']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function startDevServer() {
  // Run Vite directly with this same Node binary so there is no npm/cmd wrapper
  // to outlive the script; teardown is then a clean single-process kill.
  const child = spawn(
    process.execPath,
    [VITE_BIN, '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: 'ignore', windowsHide: true },
  )
  return child
}

function stopDevServer(child) {
  if (!child || child.exitCode !== null) return
  if (process.platform === 'win32') {
    // Synchronous so the whole tree is gone before we exit.
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' })
  } else {
    child.kill('SIGTERM')
  }
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      // not up yet
    }
    await sleep(500)
  }
  return false
}

async function measure(page) {
  return page.evaluate(() => {
    const de = document.documentElement
    const vw = de.clientWidth
    const offending = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right - vw > 1 || r.left < -1) {
        offending.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || '').slice(0, 70),
          right: Math.round(r.right),
        })
        if (offending.length >= 5) break
      }
    }
    return { scrollWidth: de.scrollWidth, clientWidth: vw, offending }
  })
}

async function visit(page, path, width, label, problems) {
  const errors = []
  const onConsole = (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  }
  const onPageError = (err) => errors.push(`pageerror: ${err.message}`)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  try {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 })
    await sleep(400)
    const result = await measure(page)
    const over = result.scrollWidth - result.clientWidth
    if (over > 1) {
      problems.push({ label, path, width, type: 'overflow', over, offending: result.offending })
      console.log(`  OVERFLOW ${label} ${path} @${width}: +${over}px`)
      for (const o of result.offending) console.log(`      <${o.tag} class="${o.cls}"> right=${o.right}`)
    }
  } catch (e) {
    problems.push({ label, path, width, type: 'error', over: 0, offending: [] })
    console.log(`  ERROR ${label} ${path} @${width}: ${e.message}`)
  }

  if (errors.length) {
    problems.push({ label, path, width, type: 'console', over: 0, offending: [] })
    for (const e of errors) console.log(`  CONSOLE ${label} ${path} @${width}: ${e}`)
  }

  page.off('console', onConsole)
  page.off('pageerror', onPageError)
}

async function main() {
  const server = startDevServer()
  const cleanup = () => stopDevServer(server)
  process.on('exit', cleanup)
  process.on('SIGINT', () => {
    cleanup()
    process.exit(1)
  })

  console.log(`Starting dev server on ${BASE} ...`)
  const ready = await waitForServer(`${BASE}/`)
  if (!ready) {
    console.error('Dev server did not become ready in time.')
    cleanup()
    process.exit(1)
  }
  console.log('Dev server ready.\n')

  const launchOpts = {}
  if (fs.existsSync(CHROME_EXE)) launchOpts.executablePath = CHROME_EXE
  const browser = await chromium.launch(launchOpts)

  const problems = []

  // Public pages (logged out).
  {
    const context = await browser.newContext()
    const page = await context.newPage()
    for (const path of PUBLIC_PAGES) {
      for (const width of WIDTHS) {
        await visit(page, path, width, 'public', problems)
      }
    }
    await context.close()
  }

  // Each role gets a fresh context so sessionStorage does not leak between roles.
  for (const { role, button, pages } of ROLES) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: button }).click()
    await page.waitForLoadState('networkidle')
    console.log(`Logged in as ${role}.`)
    for (const path of pages) {
      for (const width of WIDTHS) {
        await visit(page, path, width, role, problems)
      }
    }
    await context.close()
  }

  await browser.close()
  cleanup()

  const overflow = problems.filter((p) => p.type === 'overflow')
  const consoleErrors = problems.filter((p) => p.type === 'console' || p.type === 'error')

  console.log('\n================ SUMMARY ================')
  console.log(`Pages checked: ${ROLES.reduce((n, r) => n + r.pages.length, 0) * WIDTHS.length + PUBLIC_PAGES.length * WIDTHS.length}`)
  console.log(`Overflow problems: ${overflow.length}`)
  console.log(`Console/error problems: ${consoleErrors.length}`)

  if (overflow.length) {
    console.log('\nOverflow:')
    for (const p of overflow) console.log(`  - ${p.label} ${p.path} @${p.width} (+${p.over}px)`)
  }
  if (consoleErrors.length) {
    console.log('\nConsole errors:')
    for (const p of consoleErrors) console.log(`  - ${p.label} ${p.path} @${p.width}`)
  }

  console.log('\nRESULT:', problems.length === 0 ? 'PASS - no overflow, no console errors' : 'ISSUES FOUND')
  process.exit(problems.length === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('Unexpected failure:', e)
  process.exit(1)
})
