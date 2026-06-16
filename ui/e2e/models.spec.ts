import { test, expect } from '@playwright/test';
import { mockBridge } from './mock-bridge';

test.describe('Models', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
  });

  test('page loads with mock models without crash', async ({ page }) => {
    let errorCount = 0;
    page.on('pageerror', () => { errorCount++; });
    await page.goto('/');
    await page.waitForTimeout(3000);
    expect(errorCount).toBe(0);
  });

  test('app renders without page errors', async ({ page }) => {
    let errorCount = 0;
    page.on('pageerror', () => { errorCount++; });
    await page.goto('/');
    await page.waitForTimeout(3000);
    expect(errorCount).toBe(0);
  });
});
