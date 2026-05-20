const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'cd backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000',
      port: 8000,
      reuseExistingServer: true,
      timeout: 15000,
    },
    {
      command: 'cd frontend && npm start',
      port: 3000,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
