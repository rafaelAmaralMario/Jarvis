export type ModelCapability = 'text' | 'code' | 'image' | 'embeddings';

export type ModelStatus = 'active' | 'experimental' | 'deprecated';

export interface AiModel {
  id: string;
  providerId: string;
  name: string;
  capabilities: ModelCapability[];
  status: ModelStatus;
}

export interface TextModelProvider {
  id: string;
  name: string;
  sendMessage(request: TextProviderRequest): Promise<string>;
}

export interface TextProviderRequest {
  input: string;
  modelId: string;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

export type ProviderKind = 'mock' | 'ollama' | 'openai-compatible';

export interface ProviderSettings {
  kind: ProviderKind;
  modelId: string;
  baseUrl: string;
  apiKey?: string;
}
