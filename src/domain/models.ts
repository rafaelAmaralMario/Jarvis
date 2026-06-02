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
  sendMessage(input: string): Promise<string>;
}

