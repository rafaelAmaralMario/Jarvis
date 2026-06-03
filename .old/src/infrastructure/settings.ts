import { invoke } from '@tauri-apps/api/core';

export interface SecureSettings {
  openaiCompatibleApiKey: string;
}

export async function loadSecureSettings(): Promise<SecureSettings> {
  return invoke<{ openai_compatible_api_key: string }>('load_secure_settings').then((settings) => ({
    openaiCompatibleApiKey: settings.openai_compatible_api_key,
  }));
}

export async function saveSecureSettings(settings: SecureSettings): Promise<void> {
  return invoke<void>('save_secure_settings', {
    settings: {
      openai_compatible_api_key: settings.openaiCompatibleApiKey,
    },
  });
}
