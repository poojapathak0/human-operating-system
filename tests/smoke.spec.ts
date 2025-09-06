import { test, expect } from '@playwright/test';

// Low-end profile emulation via network + CPU
async function throttle(page) {
  // network throttling
  // @ts-ignore
  await page.context()._connection.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 300,
    downloadThroughput: 200 * 1024 / 8,
    uploadThroughput: 100 * 1024 / 8
  });
  // CPU throttling (2x)
  // @ts-ignore
  await page.context()._connection.send('Emulation.setCPUThrottlingRate', { rate: 2 });
}

test('smoke: loads Check-In quickly and shows nav', async ({ page }) => {
  await throttle(page);
  await page.goto('/');
  // TTI proxy: app header rendered under 1s on throttled profile
  const start = Date.now();
  await page.getByRole('heading', { name: 'Clear' }).waitFor({ timeout: 1000 });
  const tti = Date.now() - start;
  console.log('TTI(ms):', tti);
  await expect(page.getByRole('navigation')).toBeVisible();
});
