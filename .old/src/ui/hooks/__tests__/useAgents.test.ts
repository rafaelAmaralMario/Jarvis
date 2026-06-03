import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgents, type UseAgentsInput } from '../useAgents';
import { defaultAddLog, defaultAddAudit } from './test-utils';

const mockService = {
  runBrainAgent: vi.fn(),
  createAgentFromPrompt: vi.fn(),
};

vi.mock('../../../application/services/agent', () => ({
  createAgentService: () => mockService,
}));

vi.mock('../../../infrastructure/note', () => ({
  writeMarkdownNote: vi.fn().mockResolvedValue('/vault/note.md'),
}));

function makeInput(overrides: Partial<UseAgentsInput> = {}): UseAgentsInput {
  return {
    workspacePath: '/workspace',
    settings: {
      providerKind: 'mock',
      selectedModelId: 'mock-text',
      ollamaBaseUrl: 'http://localhost:11434',
      openaiCompatibleBaseUrl: '',
      permissions: { 'read-workspace': true, 'write-workspace': false, git: true, network: false, secrets: false },
      projectVaultPath: '/vault',
    },
    secureApiKey: '',
    modelHealth: 'ok',
    addLog: defaultAddLog,
    addAudit: defaultAddAudit,
    ...overrides,
  };
}

describe('useAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with empty custom agents', () => {
    const { result } = renderHook(() => useAgents(makeInput()));
    expect(result.current.customAgents).toEqual([]);
    expect(result.current.agentForm.name).toBe('');
  });

  it('should check agent permissions correctly', () => {
    const { result } = renderHook(() => useAgents(makeInput()));
    expect(result.current.hasAgentPermissions(['read-workspace'])).toBe(true);
    expect(result.current.hasAgentPermissions(['write-workspace'])).toBe(false);
    expect(result.current.hasAgentPermissions(['read-workspace', 'git'])).toBe(true);
  });

  it('should run brain agent', async () => {
    mockService.runBrainAgent.mockResolvedValue({ content: '# Brain content' });
    const { result } = renderHook(() => useAgents(makeInput()));
    const agent = { id: 'brain-1', name: 'Brain', goal: 'Analyze', defaultModelCapability: 'text' as const, permissions: ['read-workspace'], output: 'docs' as const };
    const files = { renderWorkspaceTree: vi.fn().mockReturnValue('tree'), rawFiles: [] };
    await act(async () => {
      await result.current.runBrainAgent(agent, '/workspace', files, [{ status: 'M', path: 'src/index.ts' }]);
    });
    expect(mockService.runBrainAgent).toHaveBeenCalled();
  });

  it('should skip brain agent when vault not configured', async () => {
    const { result } = renderHook(() => useAgents(makeInput({ settings: { ...makeInput().settings, projectVaultPath: '' } })));
    const agent = { id: 'brain-1', name: 'Brain', goal: 'Analyze', defaultModelCapability: 'text' as const, permissions: ['read-workspace'], output: 'docs' as const };
    await act(async () => {
      await result.current.runBrainAgent(agent, '/workspace', { renderWorkspaceTree: vi.fn().mockReturnValue(''), rawFiles: [] }, []);
    });
    expect(mockService.runBrainAgent).not.toHaveBeenCalled();
  });

  it('should create custom agent', async () => {
    mockService.createAgentFromPrompt.mockResolvedValue({ content: 'Refined goal' });
    const setTabs = vi.fn();
    const setActiveTabPath = vi.fn();
    const { result } = renderHook(() => useAgents(makeInput()));
    act(() => {
      result.current.setAgentForm({ name: 'My Agent', intent: 'Help with coding', permissions: ['read-workspace'] });
    });
    await act(async () => {
      await result.current.createCustomAgent('jarvis://new-agent', 'welcome.md', setTabs, setActiveTabPath);
    });
    expect(result.current.customAgents).toHaveLength(1);
    expect(result.current.customAgents[0].name).toBe('My Agent');
    expect(result.current.agentForm.name).toBe('');
  });

  it('should skip agent creation when model health is not ok', async () => {
    const { result } = renderHook(() => useAgents(makeInput({ modelHealth: 'fail' })));
    const setTabs = vi.fn();
    const setActiveTabPath = vi.fn();
    act(() => {
      result.current.setAgentForm({ name: 'My Agent', intent: 'Help', permissions: ['read-workspace'] });
    });
    await act(async () => {
      await result.current.createCustomAgent('jarvis://new-agent', 'welcome.md', setTabs, setActiveTabPath);
    });
    expect(mockService.createAgentFromPrompt).not.toHaveBeenCalled();
  });
});
