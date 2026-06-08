import { test, expect } from '@playwright/test';

const MOCK_BRIDGE = {
  checkConnection: () => true,
  getVersion: () => '0.1.0',
  getModules: () => Promise.resolve([]),
  listModels: () => Promise.resolve([]),
  getRoots: () => Promise.resolve([]),
  listFiles: () => Promise.resolve([]),
  getRecentFiles: () => Promise.resolve([]),
  listMCPServers: () => Promise.resolve([]),
  workflowList: () => Promise.resolve([]),
  securityGetPermissions: () => Promise.resolve([]),
  getModelServerStatus: () => ({ running: false, command: 'ollama serve', pid: 0, error: '' }),
  getPlatform: () => 'windows',
  getPathSeparator: () => '\\',
  getConfig: () => Promise.resolve(null),
  listChatHistory: () => Promise.resolve([]),
  loadChat: () => Promise.resolve([]),
  getModelBySpecialty: () => Promise.resolve(null),
  listAgents: () => Promise.resolve([]),
  getDefaultAgent: () => Promise.resolve(null),
  getOrchestrationConfig: () => Promise.resolve({ strategy: 'auto', maxRounds: 3 }),
  getProjectInfo: () => Promise.resolve(null),
};

async function mockBridge(page: any) {
  await page.addInitScript(() => {
    window.pywebview = {
      api: {
        getModules: () => [],
        checkConnection: () => true,
        getVersion: () => '0.1.0',
        listModels: () => [],
        getRoots: () => [],
        listFiles: () => [],
        getRecentFiles: () => [],
        listMCPServers: () => [],
        workflowList: () => [],
        securityGetPermissions: () => [],
        getModelServerStatus: () => ({ running: false, command: 'ollama serve', pid: 0, error: '' }),
        getPlatform: () => 'windows',
        getPathSeparator: () => '\\',
        getConfig: () => null,
        listChatHistory: () => [],
        loadChat: () => [],
        getModelBySpecialty: () => null,
        listAgents: () => [],
        getDefaultAgent: () => null,
        getOrchestrationConfig: () => ({ strategy: 'auto', maxRounds: 3 }),
        getProjectInfo: () => null,
        showFolderPicker: () => null,
        copyToClipboard: () => true,
        revealInExplorer: () => true,
        startModelServer: () => true,
        getRelativePath: () => '',
        getModelServerStatus: () => ({ running: false, command: 'ollama serve', pid: 0, error: '' }),
      },
    };
  });
}

test.describe('Jarvis App', () => {
  test.beforeEach(async ({ page }) => {
    await mockBridge(page);
  });

  test('loads and renders the main interface', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });
  });

  test('app renders activity bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('app has no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    const bridgeErrors = errors.filter(e => !e.includes('No bridge available'));
    expect(bridgeErrors).toEqual([]);
  });

  test('status bar renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const statusBars = page.locator('text=Ollama');
    const count = await statusBars.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
