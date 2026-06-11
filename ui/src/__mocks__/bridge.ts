type MessageHandler = (message: string) => void;

interface MockBridge {
  sendMessage: ReturnType<typeof vi.fn>;
  onMessage: ReturnType<typeof vi.fn>;
  cancelGeneration: ReturnType<typeof vi.fn>;
  listModels: ReturnType<typeof vi.fn>;
  listAgents: ReturnType<typeof vi.fn>;
  getOrchestrationConfig: ReturnType<typeof vi.fn>;
  listNotes: ReturnType<typeof vi.fn>;
  getNote: ReturnType<typeof vi.fn>;
  searchNotes: ReturnType<typeof vi.fn>;
  openWorkspace: ReturnType<typeof vi.fn>;
  listFiles: ReturnType<typeof vi.fn>;
  readFile: ReturnType<typeof vi.fn>;
  getRoots: ReturnType<typeof vi.fn>;
  chatListConversations: ReturnType<typeof vi.fn>;
  chatGetMessages: ReturnType<typeof vi.fn>;
  chatCreateConversation: ReturnType<typeof vi.fn>;
  chatSaveMessage: ReturnType<typeof vi.fn>;
  chatDeleteConversation: ReturnType<typeof vi.fn>;
  chatAutoTitle: ReturnType<typeof vi.fn>;
  toolsList: ReturnType<typeof vi.fn>;
  toolsGetRisk: ReturnType<typeof vi.fn>;
  toolsExecute: ReturnType<typeof vi.fn>;
  toolsSetWorkspace: ReturnType<typeof vi.fn>;
  toolAgentExecute: ReturnType<typeof vi.fn>;
  toolAgentAnswer: ReturnType<typeof vi.fn>;
  selfImprovementStream: ReturnType<typeof vi.fn>;
  selfImprovementGetStream: ReturnType<typeof vi.fn>;
  selfImprovementAnswer: ReturnType<typeof vi.fn>;
  selfImprovementCancel: ReturnType<typeof vi.fn>;
  llmGetFallbackConfig: ReturnType<typeof vi.fn>;
  llmSaveFallbackConfig: ReturnType<typeof vi.fn>;
  ggufDownload: ReturnType<typeof vi.fn>;
  ggufList: ReturnType<typeof vi.fn>;
  ggufDelete: ReturnType<typeof vi.fn>;
  ggufCatalog: ReturnType<typeof vi.fn>;
  ggufDiskUsage: ReturnType<typeof vi.fn>;
  audioTranscribe: ReturnType<typeof vi.fn>;
  taskPlannerExecute: ReturnType<typeof vi.fn>;
  plannerExecuteStream: ReturnType<typeof vi.fn>;
  plannerGetProgress: ReturnType<typeof vi.fn>;
  plannerCancel: ReturnType<typeof vi.fn>;
  plannerListCheckpoints: ReturnType<typeof vi.fn>;
  plannerResumeCheckpoint: ReturnType<typeof vi.fn>;
}

const handlers = new Map<string, MessageHandler[]>();

export const mockBridge: MockBridge = {
  sendMessage: vi.fn((msg: string) => {
    handlers.get('message')?.forEach((h) => h(msg));
  }),
  onMessage: vi.fn((handler: MessageHandler) => {
    if (!handlers.has('message')) handlers.set('message', []);
    handlers.get('message')!.push(handler);
  }),
  cancelGeneration: vi.fn(),
  listModels: vi.fn().mockResolvedValue([]),
  listAgents: vi.fn().mockResolvedValue([]),
  getOrchestrationConfig: vi.fn().mockResolvedValue({
    enabled: true,
    orchestratorModel: '',
    criticEnabled: true,
    criticTemperature: 0.1,
    maxAgentsPerQuery: 3,
    showTrace: true,
  }),
  listNotes: vi.fn().mockResolvedValue([]),
  getNote: vi.fn().mockResolvedValue(null),
  searchNotes: vi.fn().mockResolvedValue([]),
  openWorkspace: vi.fn().mockResolvedValue(true),
  listFiles: vi.fn().mockResolvedValue([]),
  readFile: vi.fn().mockResolvedValue(''),
  getRoots: vi.fn().mockResolvedValue([]),
  chatListConversations: vi.fn().mockResolvedValue([]),
  chatGetMessages: vi.fn().mockResolvedValue([]),
  chatCreateConversation: vi.fn().mockResolvedValue({ id: 'mock-conv-id', title: 'New Chat', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
  chatSaveMessage: vi.fn().mockResolvedValue(true),
  chatDeleteConversation: vi.fn().mockResolvedValue(true),
  chatAutoTitle: vi.fn().mockResolvedValue('Mock Title'),
  toolsList: vi.fn().mockResolvedValue([]),
  toolsGetRisk: vi.fn().mockResolvedValue('safe'),
  toolsExecute: vi.fn().mockResolvedValue({ success: true, output: 'mock output' }),
  toolsSetWorkspace: vi.fn().mockResolvedValue(true),
  toolAgentExecute: vi.fn().mockResolvedValue({ success: true, output: 'mock agent output' }),
  toolAgentAnswer: vi.fn().mockResolvedValue({ success: true, content: 'mock answer result' }),
  selfImprovementStream: vi.fn().mockResolvedValue({ taskId: 'mock-si-task' }),
  selfImprovementGetStream: vi.fn().mockResolvedValue({ step: 'completed', status: 'completed', detail: '', progress: 1.0, cancelled: false, done: true, error: null }),
  selfImprovementAnswer: vi.fn().mockResolvedValue({ success: true }),
  selfImprovementCancel: vi.fn().mockResolvedValue({ success: true }),
  llmGetFallbackConfig: vi.fn().mockResolvedValue([]),
  llmSaveFallbackConfig: vi.fn().mockResolvedValue(true),
  ggufDownload: vi.fn().mockResolvedValue({ success: true, path: '/mock/path/model.gguf' }),
  ggufList: vi.fn().mockResolvedValue([]),
  ggufDelete: vi.fn().mockResolvedValue({ success: true }),
  ggufCatalog: vi.fn().mockResolvedValue([
    { name: 'Llama 3.2 3B', repoId: 'bartowski/Llama-3.2-3B-Instruct-GGUF', filename: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf', description: 'Mock', size: '~2 GB' },
  ]),
  ggufDiskUsage: vi.fn().mockResolvedValue({ totalBytes: 0, count: 0, modelsDir: '/mock/models' }),
  audioTranscribe: vi.fn().mockResolvedValue({ success: true, text: 'mock transcription' }),
  taskPlannerExecute: vi.fn().mockResolvedValue({
    success: true,
    task: 'mock task',
    plan_summary: 'Mock plan',
    plan_id: 'mock-plan-id',
    total_steps: 1,
    completed_steps: 1,
    successful_steps: 1,
    results: [{ goal: 'mock step', success: true, output: 'done', retries: 0 }],
    cancelled: false,
  }),
  plannerExecuteStream: vi.fn().mockResolvedValue({ taskId: 'mock-planner-task' }),
  plannerGetProgress: vi.fn().mockResolvedValue({
    plan_id: 'mock-plan-id',
    task: 'mock task',
    total_steps: 1,
    current_step: 0,
    current_goal: '',
    status: 'completed',
    results: [{ goal: 'mock step', success: true, output: 'done', retries: 0 }],
    consecutive_failures: 0,
    cancelled: false,
    done: true,
    error: null,
  }),
  plannerCancel: vi.fn().mockResolvedValue({ success: true }),
  plannerListCheckpoints: vi.fn().mockResolvedValue([]),
  plannerResumeCheckpoint: vi.fn().mockResolvedValue({ taskId: 'mock-resume-task' }),
};

beforeEach(() => {
  vi.clearAllMocks();
});
