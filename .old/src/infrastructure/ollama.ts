import { invoke } from '@tauri-apps/api/core';

export async function getDefaultOllamaModelsPath(): Promise<string> {
  return invoke<string>('default_ollama_models_path');
}

export async function listOllamaModels(modelsPath: string): Promise<string[]> {
  return invoke<string[]>('list_ollama_models', { modelsPath });
}

export async function startOllamaModel(model: string): Promise<void> {
  return invoke<void>('start_ollama_model', { model });
}

export async function testOllamaModel(model: string): Promise<string> {
  return invoke<string>('test_ollama_model', { model });
}
