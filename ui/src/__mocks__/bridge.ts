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
};

beforeEach(() => {
  vi.clearAllMocks();
});
