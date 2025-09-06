// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  reporter: [['list']],
  webServer: {
    command: 'vite',
    port: 5173,
    timeout: 120_000,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:5173',
    video: 'off',
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  projects: [
    {
      name: 'android-low-end',
      use: {
        ...devices['Pixel 5'],
        // Simulate low-end conditions
        viewport: { width: 360, height: 740 },
        // network throttling via launch options will be configured in test
      }
    }
  ]
});
