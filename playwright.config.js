const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  globalSetup: './e2e/global-setup.js',
  testDir: './e2e',
  timeout: 90000,
  expect: {
    timeout: 15000,
  },
  retries: 1,
  workers: 1, // Serial execution — tests share backend state
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'cd backend && ./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8001',
      port: 8001,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'cd frontend && npm start',
      port: 3001,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
