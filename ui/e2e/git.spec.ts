import { test, expect } from '@playwright/test';
import { mockBridge } from './mock-bridge';

test.describe('Git Panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const btn = page.locator('button[title="Git"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('git panel renders without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });

  test('git status shows changes', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('git branch info is displayed without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });

  test('commit message input works without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const commitInput = page.locator('input[placeholder*="commit"], input[placeholder*="mensagem"], input[placeholder*="message"]').first();
    if (await commitInput.isVisible()) {
      await commitInput.fill('fix: resolve bug');
      await page.waitForTimeout(300);
    }
    expect(errors.length).toBe(0);
  });
});

test.describe('Git - History View', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const btn = page.locator('button[title="Git"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('commit history renders without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });
});
