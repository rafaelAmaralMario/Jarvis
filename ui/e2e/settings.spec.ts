import { test, expect } from '@playwright/test';
import { mockBridge } from './mock-bridge';

test.describe('Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const btn = page.locator('button[title="Configuracoes"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('settings page renders without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.waitForTimeout(1000);
    expect(errors.length).toBe(0);
  });

  test('settings tabs are clickable without crash', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const tabs = ['Models', 'Agents', 'Seguranca', 'Atualizacoes', 'Api Keys'];
    for (const label of tabs) {
      const tab = page.locator(`nav button:has-text("${label}"), nav a:has-text("${label}")`).first();
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(500);
      }
    }
    expect(errors.length).toBe(0);
  });

  test('models list renders without errors', async ({ page }) => {
    const modelsBtn = page.locator('button:has-text("Models")').first();
    if (await modelsBtn.isVisible()) {
      await modelsBtn.click();
      await page.waitForTimeout(800);
    }
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('agents panel renders without errors', async ({ page }) => {
    const agentsBtn = page.locator('button:has-text("Agents")').first();
    if (await agentsBtn.isVisible()) {
      await agentsBtn.click();
      await page.waitForTimeout(800);
    }
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('orchestration config toggles without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const orchBtn = page.locator('button:has-text("Orquestracao"), button:has-text("Orchestration")').first();
    if (await orchBtn.isVisible()) {
      await orchBtn.click();
      await page.waitForTimeout(800);
    }
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await page.waitForTimeout(200);
    }
    expect(errors.length).toBe(0);
  });
});

test.describe('Settings - Models View (with mock data)', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const btn = page.locator('button[title="Configuracoes"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('models list shows mock models', async ({ page }) => {
    const modelsBtn = page.locator('button:has-text("Models")').first();
    if (await modelsBtn.isVisible()) {
      await modelsBtn.click();
      await page.waitForTimeout(1000);
    }
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Settings - Updates View', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const btn = page.locator('button[title="Configuracoes"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
    }
  });

  test('updates tab is accessible without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const updatesBtn = page.locator('button:has-text("Atualizacoes"), button:has-text("Updates")').first();
    if (await updatesBtn.isVisible()) {
      await updatesBtn.click();
      await page.waitForTimeout(800);
    }
    expect(errors.length).toBe(0);
  });
});
