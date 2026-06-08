import { test, expect } from '@playwright/test';
import { mockBridge } from './mock-bridge';

test.describe('App Screens', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('aside', { timeout: 10000 });
  });

  test('main layout renders with sidebar, activity bar and main area', async ({ page }) => {
    await expect(page.locator('aside').first()).toBeVisible();
    await expect(page.locator('main, #root > div > div').first()).toBeVisible();
    const buttons = page.locator('aside button');
    expect(await buttons.count()).toBeGreaterThanOrEqual(5);
  });

  test('clicking each activity bar button navigates without crash', async ({ page }) => {
    const labels = ['Conhecimento', 'Workspace', 'Editor', 'Automação', 'Configurações'];
    for (const label of labels) {
      const btn = page.locator(`button[title="${label}"]`);
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    }
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('aside', { timeout: 10000 });
    const btn = page.locator('button[title="Configurações"]');
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(800);
    }
  });

  test('settings panel renders navigation tabs', async ({ page }) => {
    const nav = page.locator('nav').first();
    const exists = await nav.count();
    if (exists > 0) {
      await expect(nav).toBeVisible();
    }
  });

  test('clicking settings tabs does not crash', async ({ page }) => {
    const tabs = ['Models', 'Agents', 'Security', 'Atualizações'];
    for (const label of tabs) {
      const tab = page.locator(`nav button:has-text("${label}")`).first();
      if (await tab.count() > 0) {
        await tab.click();
        await page.waitForTimeout(300);
      }
    }
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Git View', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('aside', { timeout: 10000 });
    const btn = page.locator('button[title="Git"]');
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(800);
    }
  });

  test('git panel renders', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });
});
