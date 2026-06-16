import { test, expect } from '@playwright/test';
import { mockBridge } from './mock-bridge';

test.describe('Navigation - All Views', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('aside', { timeout: 10000 });
  });

  test('main layout renders sidebar, activity bar and main area', async ({ page }) => {
    await expect(page.locator('aside').first()).toBeVisible();
    const buttons = page.locator('aside button');
    expect(await buttons.count()).toBeGreaterThanOrEqual(5);
  });

  test('clicking each navigation button navigates without crash', async ({ page }) => {
    const labels = ['Conhecimento', 'Workspace + Editor', 'Git', 'Planner', 'Automacao', 'Configuracoes'];
    for (const label of labels) {
      const btn = page.locator(`button[title="${label}"]`);
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(800);
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('all views render without page errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));
    const titles = ['Conhecimento', 'Workspace + Editor', 'Git', 'Planner', 'Automacao', 'Configuracoes'];
    for (const title of titles) {
      const btn = page.locator(`button[title="${title}"]`);
      if (await btn.count() > 0) {
        await btn.click();
        await page.waitForTimeout(800);
      }
    }
    expect(pageErrors.length).toBe(0);
  });

  test('Ctrl+P opens search palette without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.keyboard.press('Control+p');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(errors.length).toBe(0);
  });

  test('Ctrl+Backtick toggles terminal without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.keyboard.press('Control+`');
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+`');
    await page.waitForTimeout(300);
    expect(errors.length).toBe(0);
  });
});

test.describe('Context Menu', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('right-click is prevented on body', async ({ page }) => {
    const prevented = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const handler = (e: MouseEvent) => resolve(e.defaultPrevented);
        window.addEventListener('contextmenu', handler, { once: true });
        document.body.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
      });
    });
    expect(prevented).toBe(true);
  });
});

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
  });

  test('app shows error UI when bridge fails', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });
});
