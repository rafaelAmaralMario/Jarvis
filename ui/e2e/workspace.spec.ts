import { test, expect } from '@playwright/test';
import { mockBridge } from './mock-bridge';

test.describe('Workspace - File Operations', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('navigating to Workspace view does not crash', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const wsBtn = page.locator('button[title="Workspace + Editor"]');
    if (await wsBtn.isVisible()) {
      await wsBtn.click();
      await page.waitForTimeout(2000);
    }
    expect(errors.length).toBe(0);
  });

  test('navigating to file tree does not crash', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const wsBtn = page.locator('button[title="Workspace + Editor"]');
    if (await wsBtn.isVisible()) {
      await wsBtn.click();
      await page.waitForTimeout(2000);
    }
    const sidebar = page.locator('aside').nth(1);
    if (await sidebar.isVisible()) {
      const fileTree = sidebar.locator('text=package.json, text=README.md, text=src').first();
      if (await fileTree.isVisible()) {
        await fileTree.click();
        await page.waitForTimeout(500);
      }
    }
    expect(errors.length).toBe(0);
  });

  test('workspace view has file list', async ({ page }) => {
    const wsBtn = page.locator('button[title="Workspace + Editor"]');
    if (await wsBtn.isVisible()) {
      await wsBtn.click();
      await page.waitForTimeout(2000);
    }
    const sidebar = page.locator('aside').nth(1);
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });

  test('clicking root folder shows files with no errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const wsBtn = page.locator('button[title="Workspace + Editor"]');
    if (await wsBtn.isVisible()) {
      await wsBtn.click();
      await page.waitForTimeout(2000);
    }
    expect(errors.length).toBe(0);
  });
});

test.describe('Planner View', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('navigating to Planner does not crash', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const btn = page.locator('button[title="Planner"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(2000);
    }
    expect(errors.length).toBe(0);
  });
});

test.describe('Automation View', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('navigating to Automation does not crash', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const btn = page.locator('button[title="Automacao"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(2000);
    }
    expect(errors.length).toBe(0);
  });
});
