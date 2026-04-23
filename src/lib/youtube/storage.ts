import { invoke } from '@tauri-apps/api/core';
import type { OAuth2Tokens, TokenStorage } from './types';

export function createTauriTokenStorage(): TokenStorage {
  return {
    async save(tokens: OAuth2Tokens): Promise<void> {
      await invoke('save_youtube_tokens', { tokens });
    },

    async load(): Promise<OAuth2Tokens | null> {
      try {
        const tokens = await invoke<OAuth2Tokens | null>('get_youtube_tokens');
        return tokens;
      } catch {
        return null;
      }
    },

    async clear(): Promise<void> {
      await invoke('clear_youtube_tokens');
    },
  };
}
