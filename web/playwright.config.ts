import os from 'node:os'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

// Keep run artifacts (including the always-written .last-run.json) out of the
// repo; the e2e suite also runs inside the docker web container as root.
const outputDir = path.join(os.tmpdir(), 'playwright-results')

export default defineConfig({
  testDir: './tests/e2e',
  outputDir,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // Serve the SPA without requiring the compose stack: unauthenticated
  // journeys only need the client, and a reachable-or-not API proxy both
  // funnel into the same guest state.
  webServer: {
    command: 'bun run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      PLAYWRIGHT: 'true',
    },
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
