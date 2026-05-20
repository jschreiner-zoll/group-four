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
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'cd backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000',
      port: 8000,
      reuseExistingServer: true,
      timeout: 20000,
    },
    {
      command: 'cd frontend && npm start',
      port: 3000,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
