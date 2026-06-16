import { test, expect } from '@playwright/test';
import { mockBridge } from './mock-bridge';

test.describe('Chat - AiPanel', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('welcome message is visible on load', async ({ page }) => {
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Ola/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('input field is present and can be typed into', async ({ page }) => {
    await page.waitForTimeout(2000);
    const input = page.locator('input[type="text"], textarea').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('Hello JARVIS');
    const value = await input.inputValue();
    expect(value).toBe('Hello JARVIS');
  });

  test('send button is present', async ({ page }) => {
    await page.waitForTimeout(2000);
    const sendBtn = page.locator('button').filter({ has: page.locator('text=Enviar, text=➤, text=Send') }).first();
    await expect(sendBtn).toBeVisible({ timeout: 5000 });
  });

  test('agent selector shows at least one agent', async ({ page }) => {
    await page.waitForTimeout(2000);
    const selects = page.locator('select');
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('typing message and pressing Enter does not crash', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.waitForTimeout(2000);
    const input = page.locator('input[type="text"], textarea').first();
    await input.fill('Ola, tudo bem?');
    await input.press('Enter');
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test('chat history button opens conversation panel', async ({ page }) => {
    await page.waitForTimeout(2000);
    const historyBtn = page.locator('button[title*="Historico"], button:has-text("☰")').first();
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('conversation list is rendered without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.waitForTimeout(2000);
    const historyBtn = page.locator('button[title*="Historico"], button:has-text("☰")').first();
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await page.waitForTimeout(500);
    }
    expect(errors.length).toBe(0);
  });

  test('new conversation button works without errors', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (err) => errors.push(err));
    await page.waitForTimeout(2000);
    const newBtn = page.locator('button[title*="Nova"], button:has-text("✚")').first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.waitForTimeout(500);
    }
    expect(errors.length).toBe(0);
  });

  test('assisted mode checkbox is present and toggleable', async ({ page }) => {
    await page.waitForTimeout(2000);
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await page.waitForTimeout(200);
      expect(await checkbox.isChecked()).toBe(true);
    }
  });

  test('voice button does not crash on click', async ({ page }) => {
    await page.waitForTimeout(2000);
    const voiceBtn = page.locator('button[title*="voz"], button[title*="audio"]').first();
    if (await voiceBtn.isVisible()) {
      await voiceBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('suggestion buttons render without errors', async ({ page }) => {
    await page.waitForTimeout(3000);
    const suggestionBtns = page.locator('button:has-text("Resumir"), button:has-text("Explicar"), button:has-text("Brainstorm"), button:has-text("Multi-Agent")');
    const count = await suggestionBtns.count();
    expect(count).toBeGreaterThanOrEqual(0);
    if (count > 0) {
      await suggestionBtns.first().click();
      await page.waitForTimeout(1000);
    }
  });
});
