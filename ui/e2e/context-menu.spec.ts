import { test, expect } from '@playwright/test';

async function mockBridge(page: any) {
  await page.addInitScript(() => {
    window.pywebview = {
      api: {
        getModules: () => [],
        checkConnection: () => true,
        getVersion: () => '0.1.0',
        listModels: () => [],
        getRoots: () => Promise.resolve([]),
        listFiles: () => Promise.resolve([]),
        getRecentFiles: () => Promise.resolve([]),
        getConfig: () => null,
        getPlatform: () => 'windows',
        getPathSeparator: () => '\\',
        getModelServerStatus: () => ({ running: false, command: 'ollama serve', pid: 0, error: '' }),
        showFolderPicker: () => null,
        copyToClipboard: () => true,
        revealInExplorer: () => true,
        getRelativePath: () => '',
      },
    };
  });
}

test.describe('Context Menu', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
  });

  test('right-click prevention is active', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const didPrevent = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const handler = (e: MouseEvent) => {
          if (e.defaultPrevented) resolve(true);
        };
        window.addEventListener('contextmenu', handler, { once: true });
        document.body.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
      });
    });
    expect(didPrevent).toBe(true);
  });

  test('right-click on body does not show browser context menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const prevented = await page.evaluate(() => {
      let prevented = false;
      const handler = (e: MouseEvent) => {
        if (e.defaultPrevented) prevented = true;
      };
      window.addEventListener('contextmenu', handler, { once: true });
      const evt = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      document.body.dispatchEvent(evt);
      return prevented;
    });
    expect(prevented).toBe(true);
  });

  test('page renders without crashing from bridge calls', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const text = await body.textContent();
    expect(text).toBeTruthy();
  });
});
