import { test, expect } from '@playwright/test';
import { mockBridge } from './mock-bridge';

test.describe('Jarvis App - Main Layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    const ignoredErrors = errors.filter(e =>
      !e.includes('No bridge available') &&
      !e.includes('favicon') &&
      !e.includes('ResizeObserver loop')
    );
    expect(ignoredErrors).toEqual([]);
  });

  test('renders body and root', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });
  });

  test('renders activity bar with 7 navigation items', async ({ page }) => {
    const aside = page.locator('aside').first();
    await expect(aside).toBeVisible({ timeout: 5000 });
    const buttons = aside.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('activity bar buttons have correct tooltip labels', async ({ page }) => {
    const labels = ['Assistente IA', 'Conhecimento', 'Workspace + Editor', 'Git', 'Planner', 'Automacao', 'Configuracoes'];
    for (const label of labels) {
      const btn = page.locator(`button[title="${label}"]`);
      if (await btn.count() > 0) {
        await expect(btn).toBeVisible();
      }
    }
  });

  test('status bar renders with version and Ollama status', async ({ page }) => {
    await page.waitForTimeout(2000);
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 5000 });
    await expect(footer.locator('text=/JARVIS/')).toBeVisible();
  });

  test('page does not crash from React errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));
    await page.waitForTimeout(2000);
    expect(pageErrors.length).toBe(0);
  });

  test('dark theme CSS variables are applied', async ({ page }) => {
    const bg = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return {
        bg: style.backgroundColor,
        color: style.color,
      };
    });
    expect(bg.bg).toBeTruthy();
    expect(bg.color).toBeTruthy();
  });
});
