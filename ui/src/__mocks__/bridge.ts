type MessageHandler = (message: string) => void;

interface MockBridge {
  sendMessage: ReturnType<typeof vi.fn>;
  onMessage: ReturnType<typeof vi.fn>;
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
};

beforeEach(() => {
  vi.clearAllMocks();
});
