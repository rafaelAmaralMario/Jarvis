import { Page } from '@playwright/test';

const MOCK_AGENTS = [
  { id: 'agent-1', name: 'Geral', model: 'llama3.2:3b', description: 'Assistente geral', systemPrompt: 'You are a helpful assistant.', temperature: 0.7, maxTokens: 2048, specialty: 'general', tools: ['read_file', 'write_file', 'search_web'], isDefault: true, canOrchestrate: false, priority: 5, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-06-01T00:00:00' },
  { id: 'agent-2', name: 'Coder', model: 'qwen2.5-coder:7b', description: 'Assistente de codigo', systemPrompt: 'You are a coding assistant.', temperature: 0.3, maxTokens: 4096, specialty: 'code', tools: ['read_file', 'write_file', 'git_commit', 'terminal_exec'], isDefault: false, canOrchestrate: true, priority: 3, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-06-01T00:00:00' },
];

const MOCK_MODELS = [
  { name: 'llama3.2:3b', specialty: 'chat', status: 'running', size: '2.0GB', modified: '2026-04-15', description: 'Modelo de chat leve e rapido', color: '#58a6ff', icon: '💬' },
  { name: 'qwen2.5-coder:7b', specialty: 'code', status: 'running', size: '4.5GB', modified: '2026-05-01', description: 'Modelo especializado em codigo', color: '#3fb950', icon: '💻' },
  { name: 'nomic-embed-text:v1.5', specialty: 'embedding', status: 'downloaded', size: '0.5GB', modified: '2026-03-01', description: 'Modelo de embeddings', color: '#d29922', icon: '📐' },
];

const MOCK_NOTES = [
  { id: 'note-1', title: 'Reuniao 15/06', content: '# Reuniao\n\nDecisao: usar microservicos', folder: 'Trabalho', tags: ['reuniao'], createdAt: '2026-06-15T10:00:00', updatedAt: '2026-06-15T10:30:00' },
  { id: 'note-2', title: 'Ideias de features', content: '## Ideias\n\n1. Modo escuro\n2. Atalhos customizados', folder: 'Pessoal', tags: ['ideias'], createdAt: '2026-06-10T08:00:00', updatedAt: '2026-06-12T14:00:00' },
  { id: 'note-3', title: 'Comandos uteis Git', content: '```bash\ngit log --oneline\ngit stash\n```', folder: 'Trabalho', tags: ['git'], createdAt: '2026-06-05T09:00:00', updatedAt: '2026-06-05T09:00:00' },
];

const MOCK_FOLDERS = ['Trabalho', 'Pessoal', 'Estudos'];

const MOCK_GRAPH = {
  nodes: MOCK_NOTES.map(n => ({ id: n.id, title: n.title })),
  edges: [{ source: 'note-1', target: 'note-2', weight: 1 }],
};

/**
 * Injects a mock pywebview bridge before the app loads.
 * All ~100 bridge methods return realistic default data.
 * Call page.evaluate() after navigation to override specific methods per test.
 */
export async function mockBridge(page: Page) {
  await page.addInitScript(() => {
    const api: Record<string, any> = {};

    function auto(name: string, value?: any) {
      api[name] = (...args: any[]) => {
        const result = typeof value === 'function' ? value(...args) : value;
        return result !== undefined ? result : null;
      };
    }

    // ── Helpers ──
    let _streams: Record<string, any> = {};
    let _taskIdCounter = 0;
    let _openFiles: string[] = [];
    let _terminalCount = 0;
    let _conversations: Array<any> = [];
    let _messages: Record<string, any[]> = {};
    let _roots: string[] = ['C:\\Users\\User\\Projects\\my-app'];
    let _files: any[] = [
      { name: 'src', path: 'C:\\Users\\User\\Projects\\my-app\\src', isDirectory: true, size: 0, modified: '2026-06-01T10:00:00' },
      { name: 'package.json', path: 'C:\\Users\\User\\Projects\\my-app\\package.json', isDirectory: false, size: 1200, modified: '2026-06-01T10:00:00' },
      { name: 'README.md', path: 'C:\\Users\\User\\Projects\\my-app\\README.md', isDirectory: false, size: 3400, modified: '2026-05-20T08:00:00' },
      { name: 'index.js', path: 'C:\\Users\\User\\Projects\\my-app\\src\\index.js', isDirectory: false, size: 850, modified: '2026-06-01T10:00:00' },
      { name: 'App.js', path: 'C:\\Users\\User\\Projects\\my-app\\src\\App.js', isDirectory: false, size: 2100, modified: '2026-06-01T10:00:00' },
    ];
    let _apiKeys: string[] = [];

    // ── Mock data ──
    const agents = [
      { id: 'agent-1', name: 'Geral', model: 'llama3.2:3b', description: 'Assistente geral', systemPrompt: '', temperature: 0.7, maxTokens: 2048, specialty: 'general', tools: ['read_file'], isDefault: true, canOrchestrate: false, priority: 5, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-06-01T00:00:00' },
      { id: 'agent-2', name: 'Coder', model: 'qwen2.5-coder:7b', description: 'Assistente de codigo', systemPrompt: '', temperature: 0.3, maxTokens: 4096, specialty: 'code', tools: ['read_file', 'write_file'], isDefault: false, canOrchestrate: true, priority: 3, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-06-01T00:00:00' },
    ];
    const models = [
      { name: 'llama3.2:3b', specialty: 'chat', status: 'running', size: '2.0GB', modified: '2026-04-15', description: 'Modelo de chat', color: '#58a6ff', icon: '💬' },
      { name: 'qwen2.5-coder:7b', specialty: 'code', status: 'running', size: '4.5GB', modified: '2026-05-01', description: 'Modelo de codigo', color: '#3fb950', icon: '💻' },
      { name: 'nomic-embed-text:v1.5', specialty: 'embedding', status: 'downloaded', size: '0.5GB', modified: '2026-03-01', description: 'Embeddings', color: '#d29922', icon: '📐' },
    ];
    const notes = [
      { id: 'note-1', title: 'Reuniao 15/06', content: '# Reuniao\n\nDecisao: usar microservicos', folder: 'Trabalho', tags: ['reuniao'], createdAt: '2026-06-15T10:00:00', updatedAt: '2026-06-15T10:30:00' },
      { id: 'note-2', title: 'Ideias', content: '## Ideias\n\n1. Modo escuro', folder: 'Pessoal', tags: ['ideias'], createdAt: '2026-06-10T08:00:00', updatedAt: '2026-06-12T14:00:00' },
      { id: 'note-3', title: 'Comandos Git', content: 'git log --oneline', folder: 'Trabalho', tags: ['git'], createdAt: '2026-06-05T09:00:00', updatedAt: '2026-06-05T09:00:00' },
    ];
    const folders = ['Trabalho', 'Pessoal', 'Estudos'];
    const graph = { nodes: notes.map((n: any) => ({ id: n.id, title: n.title })), edges: [{ source: 'note-1', target: 'note-2', weight: 1 }] };

    // ── App ──
    auto('checkConnection', true);
    auto('getAppVersion', { version: '0.2.0', app_name: 'JARVIS' });
    auto('checkForUpdates', { current_version: '0.2.0', latest_version: '', update_available: false, releases: [], error: '' });
    auto('getAvailableVersions', []);
    auto('downloadAndInstall', { success: true, path: 'C:\\Temp\\JARVIS.exe', restart: false });
    auto('quitApp', undefined);
    auto('getPlatform', 'windows');
    auto('getPathSeparator', '\\');
    auto('getRelativePath', (p: string) => {
      const parts = p.split('\\');
      return parts[parts.length - 1] || '';
    });
    auto('showFolderPicker', null);
    auto('copyToClipboard', true);
    auto('revealInExplorer', true);
    auto('logError', undefined);

    // ── Modules ──
    auto('getModules', () => [
      { id: 'module-chat', name: 'Chat', enabled: true, version: '1.0.0' },
      { id: 'module-git', name: 'Git', enabled: true, version: '1.0.0' },
      { id: 'module-terminal', name: 'Terminal', enabled: true, version: '1.0.0' },
      { id: 'module-knowledge', name: 'Knowledge', enabled: true, version: '1.0.0' },
      { id: 'module-camera', name: 'Camera', enabled: false, version: '1.0.0' },
    ]);
    auto('getModule', (id: string) => {
      const mods = api.getModules();
      return mods.find((m: any) => m.id === id) || null;
    });

    // ── Models ──
    auto('listModels', models);
    auto('getModel', (name: string) => models.find((m: any) => m.name === name) || null);
    auto('getModelBySpecialty', (s: string) => models.find((m: any) => m.specialty === s) || null);
    auto('pullModel', true);
    auto('deleteModel', true);
    auto('startModel', true);
    auto('stopModel', true);
    auto('updateModelMetadata', true);
    auto('getModelServerStatus', () => ({ running: false, command: 'ollama serve', pid: 0, error: '' }));
    auto('startModelServer', true);

    // ── Agents ──
    auto('listAgents', agents);
    auto('getAgent', (id: string) => agents.find((a: any) => a.id === id) || null);
    auto('createAgent', (data: any) => {
      const a = { id: 'agent-' + Date.now(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      agents.push(a);
      return a;
    });
    auto('updateAgent', true);
    auto('deleteAgent', true);
    auto('setDefaultAgent', true);
    auto('getDefaultAgent', () => agents.find((a: any) => a.isDefault) || agents[0] || null);
    auto('getOrchestrationPool', () => agents.filter((a: any) => a.canOrchestrate));

    // ── Orchestration ──
    auto('getOrchestrationConfig', { enabled: true, orchestratorModel: 'llama3.2:3b', criticEnabled: false, criticTemperature: 0.1, maxAgentsPerQuery: 3, showTrace: true });
    auto('updateOrchestrationConfig', true);
    auto('executeOrchestratedQuery', 'Resposta orquestrada simulada.');
    auto('getAgentTrace', () => ({
      trace: [
        { agentId: 'agent-1', agentName: 'Geral', query: 'consulta', status: 'completed', duration: 1500 },
        { agentId: 'agent-2', agentName: 'Coder', query: 'consulta', status: 'completed', duration: 2300 },
      ],
    }));

    // ── LLM Gateway ──
    auto('llmGetProviders', () => [
      { id: 'ollama', name: 'Ollama', type: 'local', enabled: true, defaultModel: 'llama3.2:3b', models: ['llama3.2:3b', 'qwen2.5-coder:7b'] },
      { id: 'openai', name: 'OpenAI', type: 'cloud', enabled: false, defaultModel: 'gpt-4', models: ['gpt-4', 'gpt-3.5-turbo'] },
    ]);
    auto('llmGetProvider', (id: string) => {
      const list = api.llmGetProviders();
      return list.find((p: any) => p.id === id) || null;
    });
    auto('llmSaveProvider', true);
    auto('llmSetDefaultProvider', true);
    auto('llmTestConnection', { success: true, message: 'Conexao OK' });
    auto('llmGetDefaultProvider', () => {
      const list = api.llmGetProviders();
      return list.find((p: any) => p.enabled) || null;
    });
    auto('llmGenerate', { content: 'Resposta simulada.', done: true });

    // ── Workspace / Files ──
    auto('getRoots', _roots);
    auto('addRoot', (path: string) => { _roots.push(path); return true; });
    auto('removeRoot', (path: string) => { _roots = _roots.filter((r: string) => r !== path); return true; });
    auto('openWorkspace', true);
    auto('listFiles', (dir?: string) => {
      const base = dir || _roots[0];
      return _files.filter((f: any) => {
        const parent = f.path.substring(0, f.path.lastIndexOf('\\'));
        return parent === base;
      });
    });
    auto('listDirectory', (dir?: string) => api.listFiles(dir));
    auto('readFile', (path: string) => {
      const f = _files.find((x: any) => x.path === path);
      return f ? '// Conteudo de ' + f.name + '\nconsole.log("hello");' : '';
    });
    auto('writeFile', true);
    auto('createFile', (path: string) => {
      const parts = path.split('\\');
      _files.push({ name: parts[parts.length - 1], path, isDirectory: false, size: 0, modified: new Date().toISOString() });
      return true;
    });
    auto('createDirectory', (path: string) => {
      const parts = path.split('\\');
      _files.push({ name: parts[parts.length - 1], path, isDirectory: true, size: 0, modified: new Date().toISOString() });
      return true;
    });
    auto('createFileWithPath', (path: string) => { api.createFile(path); return true; });
    auto('deletePath', true);
    auto('renamePath', true);
    auto('movePath', true);
    auto('getRecentFiles', () => _files.filter((f: any) => !f.isDirectory).slice(0, 5));
    auto('getProjectInfo', () => ({
      name: 'my-app', path: _roots[0], language: 'JavaScript', framework: 'React', files: _files.length,
    }));

    // ── Editor ──
    auto('editorOpenFile', (path: string) => {
      if (!_openFiles.includes(path)) _openFiles.push(path);
      return { path, content: api.readFile(path), language: 'javascript' };
    });
    auto('editorSaveFile', true);
    auto('editorCloseFile', (path: string) => {
      _openFiles = _openFiles.filter((f: string) => f !== path);
      return true;
    });
    auto('editorGetOpenFiles', () => _openFiles.map((p: string) => ({
      path: p, name: p.split('\\').pop(), language: 'javascript',
    })));
    auto('editorDetectLanguage', 'javascript');
    auto('editorSearchFiles', (q: string) => _files.filter((f: any) => f.name.includes(q)));
    auto('editorGetSettings', { fontSize: 14, tabSize: 2, wordWrap: true, minimap: true, lineNumbers: true });
    auto('editorUpdateSettings', true);

    // ── Git ──
    auto('gitIsRepo', true);
    auto('gitCurrentBranch', 'main');
    auto('gitBranches', () => [
      { name: 'main', current: true, ahead: 2, behind: 0 },
      { name: 'develop', current: false, ahead: 0, behind: 0 },
      { name: 'feature/new-ui', current: false, ahead: 0, behind: 3 },
    ]);
    auto('gitStatus', () => [
      { path: 'src/index.js', status: 'modified', staged: false },
      { path: 'package.json', status: 'modified', staged: true },
      { path: 'src/new-file.js', status: 'added', staged: false },
    ]);
    auto('gitLog', () => [
      { hash: 'a1b2c3d', message: 'feat: add new feature', author: 'User', date: '2026-06-15T10:00:00' },
      { hash: 'e4f5g6h', message: 'fix: resolve bug', author: 'User', date: '2026-06-14T09:00:00' },
      { hash: 'i7j8k9l', message: 'refactor: clean up', author: 'User', date: '2026-06-13T08:00:00' },
    ]);
    auto('gitDiff', 'diff --git a/file.js b/file.js\nindex abc..def 100644\n--- a/file.js\n+++ b/file.js\n@@ -1,3 +1,4 @@\n+console.log("new line");\n');
    auto('gitDiffGutter', []);
    auto('gitStage', true);
    auto('gitUnstage', true);
    auto('gitStageAll', true);
    auto('gitCommit', (msg: string) => {
      const log = api.gitLog();
      log.unshift({ hash: 'abc' + Date.now().toString(16), message: msg, author: 'User', date: new Date().toISOString() });
      return true;
    });
    auto('gitCreateBranch', true);
    auto('gitCheckout', true);
    auto('gitDeleteBranch', true);
    auto('gitPush', true);
    auto('gitPull', true);
    auto('gitSetCredentials', true);

    // ── Chat ──
    auto('sendMessage', (text: string) => 'Resposta para: "' + text + '". Como posso ajudar mais?');
    auto('cancelGeneration', undefined);
    auto('chatListConversations', () => _conversations);
    auto('chatGetMessages', (id: string) => _messages[id] || []);
    auto('chatCreateConversation', (title?: string) => {
      const conv = { id: 'conv-' + Date.now(), title: title || 'Nova conversa', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      _conversations.push(conv);
      _messages[conv.id] = [];
      return conv;
    });
    auto('chatSaveMessage', (cid: string, msg: any) => {
      if (!_messages[cid]) _messages[cid] = [];
      _messages[cid].push(msg);
      return true;
    });
    auto('chatDeleteConversation', (id: string) => {
      _conversations = _conversations.filter((c: any) => c.id !== id);
      delete _messages[id];
      return true;
    });
    auto('chatAutoTitle', (text: string) => 'Sobre ' + text.substring(0, 30) + '...');

    // ── Tools ──
    auto('toolsList', () => [
      { name: 'read_file', description: 'Read file contents', risk: 'safe', category: 'files' },
      { name: 'write_file', description: 'Write content to file', risk: 'medium', category: 'files' },
      { name: 'terminal_exec', description: 'Execute terminal command', risk: 'high', category: 'system' },
      { name: 'search_web', description: 'Search the web', risk: 'medium', category: 'web' },
      { name: 'git_commit', description: 'Create a git commit', risk: 'medium', category: 'git' },
    ]);
    auto('toolsGetRisk', (name: string) => {
      const t = api.toolsList().find((x: any) => x.name === name);
      return t ? t.risk : 'safe';
    });
    auto('toolsExecute', (name: string, args: any) => ({ success: true, output: 'Executado ' + name + ' com sucesso.', data: null }));
    auto('toolsSetWorkspace', true);
    auto('toolAgentExecute', (query: string) => ({
      success: true, output: 'Resultado para: "' + query + '"', content: 'Processei: "' + query + '"', toolCalls: [], toolResults: [], pendingQuestion: null,
    }));
    auto('toolAgentAnswer', (qId: string, answer: string) => {
      if (_streams[qId]) { _streams[qId].pendingQuestion = null; _streams[qId].done = true; }
      return true;
    });

    // ── Streaming Tool Agent ──
    auto('toolAgentExecuteStream', (query: string) => {
      _taskIdCounter++;
      const taskId = 'task-' + _taskIdCounter + '-' + Date.now();
      _streams[taskId] = { content: '', toolCalls: [], toolResults: [], pendingQuestion: null, done: false, error: null, cancelled: false, answer: null };
      setTimeout(() => {
        _streams[taskId].toolCalls = [{ name: 'search_web', args: { query }, round: 1 }];
        _streams[taskId].content = 'Processando sua solicitacao...';
        setTimeout(() => {
          _streams[taskId].toolResults = [{ name: 'search_web', args: { query }, success: true, output: 'Resultados encontrados.', round: 1 }];
          _streams[taskId].content = 'Aqui esta o resultado.';
          _streams[taskId].done = true;
        }, 50);
      }, 50);
      return { taskId };
    });
    auto('toolAgentGetStream', (taskId: string) => _streams[taskId] || { content: '', toolCalls: [], toolResults: [], done: true, error: null });

    // ── Knowledge ──
    auto('listNotes', notes);
    auto('getNote', (id: string) => notes.find((n: any) => n.id === id) || null);
    auto('createNote', (data: any) => {
      const n = { id: 'note-' + Date.now(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      notes.push(n);
      return n;
    });
    auto('updateNote', (id: string, data: any) => {
      const i = notes.findIndex((n: any) => n.id === id);
      if (i >= 0) notes[i] = { ...notes[i], ...data, updatedAt: new Date().toISOString() };
      return true;
    });
    auto('deleteNote', (id: string) => {
      const i = notes.findIndex((n: any) => n.id === id);
      if (i >= 0) notes.splice(i, 1);
      return true;
    });
    auto('searchNotes', (q: string) => notes.filter((n: any) =>
      n.title.toLowerCase().includes(q.toLowerCase()) || n.content.toLowerCase().includes(q.toLowerCase())
    ));
    auto('getFolders', folders);
    auto('moveNote', true);
    auto('getGraph', graph);
    auto('getBacklinks', (id: string) => {
      const edges = graph.edges.filter((e: any) => e.target === id);
      return edges.map((e: any) => graph.nodes.find((n: any) => n.id === e.source)).filter(Boolean);
    });
    auto('importNote', (path: string) => ({
      id: 'note-imported', title: 'Nota Importada', content: 'Conteudo importado', folder: 'Geral', tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }));
    auto('exportNote', (id: string, fmt: string) => ({ success: true, path: 'C:\\Users\\User\\Documents\\' + id + '.' + fmt }));

    // ── Network ──
    auto('networkGet', { statusCode: 200, body: '{"success":true}' });
    auto('networkPost', { statusCode: 200, body: '{"success":true}' });
    auto('networkOAuthStart', 'https://example.com/oauth');
    auto('networkOAuthComplete', { token: 'mock-token-123', provider: 'github' });
    auto('networkListApiKeys', () => _apiKeys.map((k: string) => ({ provider: k, key: k, createdAt: new Date().toISOString() })));
    auto('networkStoreApiKey', (provider: string, key: string) => { if (!_apiKeys.includes(provider)) _apiKeys.push(provider); return true; });
    auto('networkGetApiKey', (provider: string) => _apiKeys.includes(provider) ? 'sk-' + provider : '');
    auto('networkDeleteApiKey', (provider: string) => { _apiKeys = _apiKeys.filter((k: string) => k !== provider); return true; });
    auto('networkGetStoredToken', null);
    auto('networkClearToken', true);

    // ── Terminal ──
    auto('terminalCreate', () => { _terminalCount++; return 'term-' + _terminalCount; });
    auto('terminalWrite', true);
    auto('terminalResize', true);
    auto('terminalClose', true);
    auto('terminalCloseAll', true);
    auto('terminalList', () => {
      const terms = [];
      for (let i = 1; i <= _terminalCount; i++) {
        terms.push({ id: 'term-' + i, name: 'bash', cwd: 'C:\\Users\\User\\Projects\\my-app', pid: 1000 + i });
      }
      return terms;
    });

    // ── MCP ──
    auto('mcpListServers', () => [
      { id: 'mcp-files', name: 'File Server', type: 'local', status: 'running', tools: ['read', 'write', 'list'] },
      { id: 'mcp-web', name: 'Web Server', type: 'http', status: 'stopped', tools: ['fetch', 'search'] },
    ]);
    auto('mcpGetServer', (id: string) => {
      const list = api.mcpListServers();
      return list.find((s: any) => s.id === id) || null;
    });
    auto('mcpCreateServer', (data: any) => ({ id: 'mcp-' + Date.now(), ...data, status: 'stopped', tools: [] }));
    auto('mcpUpdateServer', true);
    auto('mcpDeleteServer', true);
    auto('mcpStartServer', true);
    auto('mcpStopServer', true);
    auto('mcpListTools', () => [
      { name: 'read_file', description: 'Read file', inputSchema: { type: 'object', properties: { path: { type: 'string' } } } },
      { name: 'write_file', description: 'Write file', inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } } },
    ]);
    auto('mcpCallTool', (serverId: string, toolName: string, args: any) => ({ success: true, output: 'MCP ' + serverId + ':' + toolName + ' executado.' }));

    // ── Workflow ──
    auto('workflowList', () => [
      { id: 'wf-1', name: 'Build & Test', description: 'Compila e roda testes', steps: 3, lastRun: null, status: 'idle', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00' },
      { id: 'wf-2', name: 'Deploy', description: 'Faz deploy para producao', steps: 5, lastRun: '2026-06-10T10:00:00', status: 'success', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00' },
    ]);
    auto('workflowGet', (id: string) => {
      const list = api.workflowList();
      return list.find((w: any) => w.id === id) || null;
    });
    auto('workflowCreate', (data: any) => ({ id: 'wf-' + Date.now(), ...data, status: 'idle', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
    auto('workflowUpdate', true);
    auto('workflowDelete', true);
    auto('workflowExecute', () => ({ success: true, output: 'Workflow executado com sucesso.' }));
    auto('aiGenerateWorkflow', (prompt: string) => ({ id: 'wf-ai', name: 'Workflow Gerado', description: prompt, steps: [] }));

    // ── Security ──
    auto('securityGetPermissions', () => [
      { tool: 'read_file', risk: 'safe', allowed: true },
      { tool: 'write_file', risk: 'medium', allowed: true },
      { tool: 'terminal_exec', risk: 'high', allowed: false, ask: true },
      { tool: 'search_web', risk: 'medium', allowed: true },
      { tool: 'git_commit', risk: 'medium', allowed: true },
    ]);
    auto('securityGetModulePermissions', (id: string) => ({ moduleId: id, allowed: true, permissions: api.securityGetPermissions() }));
    auto('securitySetPermission', () => true);
    auto('securityGetAuditLog', () => [
      { timestamp: '2026-06-15T10:30:00', action: 'file_write', tool: 'write_file', allowed: true, details: 'Wrote to src/index.js' },
      { timestamp: '2026-06-15T10:29:00', action: 'git_commit', tool: 'git_commit', allowed: true, details: 'Commit: fix bug' },
    ]);
    auto('securityStoreSecret', true);
    auto('securityGetSecret', (key: string) => key === 'api_key' ? 'sk-mock' : '');
    auto('securityDeleteSecret', true);
    auto('securityListSecrets', () => [{ key: 'api_key', provider: 'openai', createdAt: '2026-01-01T00:00:00' }]);

    // ── Output / Problems ──
    auto('outputGetLogs', () => [
      { level: 'info', message: 'App started', timestamp: '2026-06-15T10:00:00' },
      { level: 'warn', message: 'Model not found', timestamp: '2026-06-15T10:01:00' },
      { level: 'error', message: 'Connection failed', timestamp: '2026-06-15T10:02:00' },
    ]);
    auto('outputLog', undefined);
    auto('outputClearLogs', true);
    auto('problemsGet', () => [
      { file: 'src/index.js', line: 10, column: 5, message: 'Missing semicolon', severity: 'warning' },
      { file: 'src/App.js', line: 42, column: 8, message: 'Unused variable', severity: 'info' },
    ]);
    auto('problemsAdd', true);
    auto('problemsClear', true);

    // ── Audio / Video ──
    auto('audioTranscribe', () => ({ text: 'Transcricao simulada do audio.', language: 'pt' }));
    auto('ttsSynthesize', () => ({ success: true, path: 'C:\\Temp\\tts-output.wav', duration: 3.5 }));
    auto('voiceConversationStream', () => ({ status: 'processing' }));
    auto('voiceConversationGetStream', () => ({ content: 'Resposta de voz simulada.', done: true }));

    // ── Camera ──
    auto('cameraCapture', () => ({ success: true, path: 'C:\\Temp\\capture.jpg', width: 1920, height: 1080 }));
    auto('cameraAnalyze', () => ({ description: 'Imagem capturada: parece um documento.', labels: ['documento', 'texto'] }));

    // ── Self-Improvement ──
    auto('selfImprovementStream', () => ({ taskId: 'si-' + Date.now() }));
    auto('selfImprovementGetStream', () => ({ content: 'Analise concluida.', done: true, suggestions: [] }));
    auto('selfImprovementAnswer', () => true);
    auto('selfImprovementCancel', undefined);

    // ── Task Planner ──
    auto('taskPlannerExecute', (goal: string) => ({
      plan: { goal, steps: [
        { id: 'step-1', description: 'Pesquisar', status: 'completed', duration: 5000 },
        { id: 'step-2', description: 'Analisar', status: 'in_progress', duration: 0 },
        { id: 'step-3', description: 'Concluir', status: 'pending', duration: 0 },
      ], status: 'running' },
    }));
    auto('plannerExecuteStream', () => ({ taskId: 'plan-' + Date.now() }));
    auto('plannerGetProgress', () => ({ content: 'Progresso do plano...', steps: [], done: false, error: null }));
    auto('plannerCancel', undefined);
    auto('plannerListCheckpoints', () => []);
    auto('plannerResumeCheckpoint', () => true);

    // ── LLM Router ──
    auto('llmRouterGetRules', () => [
      { id: 'rule-1', name: 'Code queries', pattern: 'codigo|code|program', provider: 'ollama', model: 'qwen2.5-coder:7b', priority: 10, enabled: true },
      { id: 'rule-2', name: 'Simple chat', pattern: '.*', provider: 'ollama', model: 'llama3.2:3b', priority: 1, enabled: true },
    ]);
    auto('llmRouterSaveRule', (rule: any) => ({ id: 'rule-' + Date.now(), ...rule }));
    auto('llmRouterDeleteRule', true);
    auto('llmRouterGetMetrics', () => ({ totalQueries: 150, averageLatency: 2340, cacheHitRate: 0.35, providerBreakdown: { ollama: 120, openai: 30 } }));
    auto('llmRouterClearCache', true);
    auto('llmRouterGetCacheInfo', () => ({ size: 1024, entries: 45, maxSize: 10240 }));
    auto('llmGetFallbackConfig', () => ({
      enabled: true, strategy: 'round_robin',
      providers: [
        { id: 'ollama', priority: 1, timeout: 30000 },
        { id: 'openai', priority: 2, timeout: 15000 },
      ],
    }));
    auto('llmSaveFallbackConfig', true);

    // ── GGUF / HuggingFace ──
    auto('hfSearchModels', () => [
      { id: 'TheBloke/Llama-2-7B-GGUF', name: 'Llama 2 7B', downloads: 50000, likes: 1200, quantizations: ['Q4_K_M', 'Q5_K_M', 'Q8_0'] },
    ]);
    auto('ggufDownload', () => ({ success: true, path: 'C:\\Models\\downloaded.gguf', progress: 1.0 }));
    auto('ggufList', () => [
      { name: 'llama3.2-3b-q4.gguf', path: 'C:\\Models\\llama3.2-3b-q4.gguf', size: '1.8GB', status: 'loaded' },
      { name: 'qwen2.5-coder-7b-q4.gguf', path: 'C:\\Models\\qwen2.5-coder-7b-q4.gguf', size: '4.2GB', status: 'unloaded' },
    ]);
    auto('ggufDelete', true);
    auto('ggufCatalog', () => ({ totalModels: 2, totalSize: '6.0GB', cachePath: 'C:\\Models' }));
    auto('ggufDiskUsage', () => ({ total: '100GB', used: '45GB', free: '55GB', modelsSize: '6.0GB' }));

    // ── Events ──
    auto('onEvent', undefined);
    auto('offEvent', undefined);

    // ── Expose ──
    (window as any).pywebview = { api };
    (window as any).jarvis = api;
  });
}

/**
 * Override a specific bridge method AFTER the page has loaded.
 * Use this in tests to customize behavior per scenario.
 */
export async function overrideBridge(page: Page, method: string, fn: (...args: any[]) => any) {
  await page.evaluate(({ method, fnStr }) => {
    const api = (window as any).pywebview?.api || (window as any).jarvis;
    if (api) {
      api[method] = (...args: any[]) => {
        const result = fnStr(...args);
        return result !== undefined ? result : null;
      };
    }
  }, { method, fnStr: fn.toString() });
}
