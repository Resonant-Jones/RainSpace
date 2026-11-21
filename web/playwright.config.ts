import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://127.0.0.1:${PORT}`

// `npm run test:e2e` runs Chromium. Set PW_BROWSER to run a different engine:
//   PW_BROWSER=firefox npm run test:e2e
//   PW_BROWSER=chromium,firefox npm run test:e2e
const requestedBrowsers = (process.env.PW_BROWSER ?? 'chromium')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean)

// Extra Chromium launch flags, space separated. Empty by default.
//
// Restricted environments (sandboxes, some CI runners) can block Chromium's
// Mach port bootstrap, which fails the browser at startup. `--single-process
// --no-zygote` avoids that path. It is opt-in because single-process mode is
// slower and less representative of a real browser:
//   PW_CHROMIUM_ARGS="--single-process --no-zygote" npm run test:e2e
const chromiumArgs = (process.env.PW_CHROMIUM_ARGS ?? '')
  .split(' ')
  .map((flag) => flag.trim())
  .filter(Boolean)

const allProjects = [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: chromiumArgs.length ? { args: chromiumArgs } : {},
    },
  },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
]

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: allProjects.filter((project) => requestedBrowsers.includes(project.name)),
  webServer: {
    // The production build is what Netlify serves, so the browser test runs
    // against the built bundle rather than the dev server.
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
