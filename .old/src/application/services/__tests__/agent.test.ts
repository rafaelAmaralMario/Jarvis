import { describe, it, expect } from 'vitest';
import { createAgentService, type AgentServiceConfig } from '../agent';

function makeConfig(overrides: Partial<AgentServiceConfig> = {}): AgentServiceConfig {
  return {
    providerKind: 'mock',
    selectedModelId: 'mock-text',
    ollamaBaseUrl: '',
    openaiCompatibleBaseUrl: '',
    projectVaultPath: '/vault',
    ...overrides,
  };
}

describe('AgentService', () => {
  it('creates a service with mock config', () => {
    const service = createAgentService(makeConfig());
    expect(service).toBeDefined();
    expect(service.runBrainAgent).toBeInstanceOf(Function);
    expect(service.createAgentFromPrompt).toBeInstanceOf(Function);
  });

  it('runBrainAgent returns content for mock provider', async () => {
    const service = createAgentService(makeConfig());
    const result = await service.runBrainAgent({
      workspacePath: '/project',
      modelId: 'mock-text',
      filesTree: 'src/\n  index.ts',
      gitChanges: '- M src/index.ts',
    });
    expect(result.content).toBeTruthy();
    expect(typeof result.content).toBe('string');
  });

  it('runBrainAgent includes workspace path in prompt', async () => {
    const service = createAgentService(makeConfig());
    const result = await service.runBrainAgent({
      workspacePath: '/test-workspace',
      modelId: 'mock-text',
      filesTree: '',
      gitChanges: '',
    });
    expect(result.content).toContain('/test-workspace');
  });

  it('runBrainAgent includes files tree in prompt', async () => {
    const service = createAgentService(makeConfig());
    const result = await service.runBrainAgent({
      workspacePath: '/p',
      modelId: 'mock-text',
      filesTree: 'src/main.ts\nsrc/utils.ts',
      gitChanges: '',
    });
    expect(result.content).toContain('src/main.ts');
  });

  it('createAgentFromPrompt returns content for mock provider', async () => {
    const service = createAgentService(makeConfig());
    const result = await service.createAgentFromPrompt({
      name: 'Test Agent',
      intent: 'Analyze code',
      modelId: 'mock-text',
    });
    expect(result.content).toBeTruthy();
    expect(typeof result.content).toBe('string');
  });

  it('createAgentFromPrompt includes agent name in prompt', async () => {
    const service = createAgentService(makeConfig());
    const result = await service.createAgentFromPrompt({
      name: 'CodeReviewer',
      intent: 'Review pull requests',
      modelId: 'mock-text',
    });
    expect(result.content).toContain('CodeReviewer');
  });
});
