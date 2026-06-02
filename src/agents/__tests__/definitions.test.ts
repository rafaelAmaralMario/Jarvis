import { agentRegistry, type AgentDefinition } from '../index';

describe('Agent Definitions', () => {
  it('has exactly 4 built-in agents', () => {
    expect(agentRegistry.getAll()).toHaveLength(4);
  });

  it('each agent has required fields', () => {
    for (const agent of agentRegistry.getAll()) {
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBeTruthy();
      expect(agent.goal).toBeTruthy();
      expect(agent.permissions).toBeInstanceOf(Array);
      expect(['text', 'code']).toContain(agent.defaultModelCapability);
      expect(['diff', 'review', 'docs', 'context']).toContain(agent.output);
    }
  });

  it('has unique agent ids', () => {
    const ids = agentRegistry.getAll().map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('agent project-brain has read-workspace permission', () => {
    const brain = agentRegistry.get('project-brain')!;
    expect(brain.permissions).toContain('read-workspace');
    expect(brain.output).toBe('context');
    expect(brain.defaultModelCapability).toBe('text');
  });

  it('agent developer has read and write permissions', () => {
    const dev = agentRegistry.get('developer')!;
    expect(dev.permissions).toContain('read-workspace');
    expect(dev.permissions).toContain('write-workspace');
    expect(dev.output).toBe('diff');
    expect(dev.defaultModelCapability).toBe('code');
  });

  it('agent reviewer has read-workspace and git permissions', () => {
    const reviewer = agentRegistry.get('reviewer')!;
    expect(reviewer.permissions).toContain('read-workspace');
    expect(reviewer.permissions).toContain('git');
    expect(reviewer.output).toBe('review');
    expect(reviewer.defaultModelCapability).toBe('code');
  });

  it('agent documenter has read-workspace permission', () => {
    const doc = agentRegistry.get('documenter')!;
    expect(doc.permissions).toContain('read-workspace');
    expect(doc.permissions).toHaveLength(1);
    expect(doc.output).toBe('docs');
    expect(doc.defaultModelCapability).toBe('text');
  });

  it('allows registering new agents', () => {
    agentRegistry.register({
      id: 'tester',
      name: 'Tester',
      goal: 'Write tests for code changes.',
      defaultModelCapability: 'code',
      permissions: ['read-workspace', 'git'],
      output: 'review',
    });
    expect(agentRegistry.get('tester')?.name).toBe('Tester');
  });
});
