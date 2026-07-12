// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  webServer: {
    // serves the repo root as static files — same layout GitHub Pages uses
    command: 'npx serve -l 8080 .',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
