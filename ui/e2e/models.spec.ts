import { test, expect } from '@playwright/test';

async function mockBridge(page: any) {
  await page.addInitScript(() => {
    window.pywebview = {
      api: {
        getModules: () => [],
        checkConnection: () => true,
        getVersion: () => '0.1.0',
        listModels: () => [
          { name: 'qwen2.5-coder:7b', specialty: 'code', status: 'running', size: '4.5GB', modified: '2026-05-01', description: 'Coding model', color: '#3fb950', icon: '💻' },
          { name: 'llama3.2:3b', specialty: 'chat', status: 'downloaded', size: '2.0GB', modified: '2026-04-15', description: 'Chat model', color: '#58a6ff', icon: '💬' },
          { name: 'nomic-embed-text:v1.5', specialty: 'embedding', status: 'downloaded', size: '0.5GB', modified: '2026-03-01', description: 'Embedding model', color: '#d29922', icon: '📐' },
        ],
        getRoots: () => [],
        listFiles: () => [],
        getConfig: () => null,
        getModelServerStatus: () => ({ running: true, command: 'ollama serve', pid: 12345, error: '' }),
        getModel: (name: string) => ({ name, specialty: 'chat', status: 'downloaded', size: '2GB', modified: '2026-01-01', description: '', color: '#58a6ff', icon: '💬' }),
      },
    };
  });
}

test.describe('Models', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
  });

  test('page loads with mock models', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('app renders without crashing', async ({ page }) => {
    let errorCount = 0;
    page.on('pageerror', () => { errorCount++; });
    await page.goto('/');
    await page.waitForTimeout(3000);
    expect(errorCount).toBe(0);
  });
});
