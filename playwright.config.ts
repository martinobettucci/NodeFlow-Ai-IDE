import { defineConfig } from '@playwright/test';

// Every feature/fix ships with a Playwright spec that records a video
// demonstrating it (see CLAUDE.md). Specs live in e2e/*.spec.ts; the
// full cross-app panorama recorder is e2e/record-panorama.mjs.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL: process.env.IDE_URL || 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 720 },
    video: 'on',
    trace: 'retain-on-failure',
  },
  outputDir: 'e2e/videos',
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
