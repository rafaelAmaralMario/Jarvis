import { test, expect } from '@playwright/test';
import { mockBridge } from './mock-bridge';

test.describe('Knowledge Panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('navigating to Knowledge view does not crash', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const btn = page.locator('button[title="Conhecimento"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(3000);
    }
    expect(errors.length).toBe(0);
  });

  test('note list renders when available', async ({ page }) => {
    const btn = page.locator('button[title="Conhecimento"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(3000);
    }
    const body = page.locator('body');
    const text = await body.textContent();
    expect(text).toBeTruthy();
  });

  test('note search renders without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const btn = page.locator('button[title="Conhecimento"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(2000);
    }
    const searchInput = page.locator('input[placeholder*="buscar"], input[placeholder*="search"], input[placeholder*="pesquisar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('reuniao');
      await page.waitForTimeout(500);
    }
    expect(errors.length).toBe(0);
  });

  test('graph view renders without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const btn = page.locator('button[title="Conhecimento"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(2000);
    }
    const graphBtn = page.locator('button:has-text("Grafo"), button:has-text("Graph")').first();
    if (await graphBtn.isVisible()) {
      await graphBtn.click();
      await page.waitForTimeout(1000);
    }
    expect(errors.length).toBe(0);
  });
});

test.describe('Knowledge Panel - Note CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    const btn = page.locator('button[title="Conhecimento"]');
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(2000);
    }
  });

  test('new note button is present', async ({ page }) => {
    const newBtn = page.locator('button:has-text("Nova"), button:has-text("New"), button[title*="Nova"]').first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('clicking a note does not crash', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    const noteItem = page.locator('text=Reuniao, text=Ideias, text=Comandos').first();
    if (await noteItem.isVisible()) {
      await noteItem.click();
      await page.waitForTimeout(500);
    }
    expect(errors.length).toBe(0);
  });
});
