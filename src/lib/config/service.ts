import { configSchema, type AppConfig } from './schema';
import { getDefaultConfig } from './defaults';
import { invoke } from '@tauri-apps/api/core';

let cachedConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  try {
    const raw = await invoke<Record<string, unknown>>('get_config');
    const result = configSchema.safeParse(raw);
    if (result.success) {
      cachedConfig = result.data;
      return result.data;
    }
    console.warn('Config validation failed, using defaults:', result.error);
    cachedConfig = getDefaultConfig();
    return cachedConfig;
  } catch {
    cachedConfig = getDefaultConfig();
    return cachedConfig;
  }
}

export function getConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  return getDefaultConfig();
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const validated = configSchema.parse(config);
  await invoke('save_config', { config: validated });
  cachedConfig = validated;
}

export async function resetConfig(): Promise<AppConfig> {
  const defaults = getDefaultConfig();
  await invoke('save_config', { config: defaults });
  cachedConfig = defaults;
  return defaults;
}

export function validateConfig(raw: unknown): {
  valid: boolean;
  config?: AppConfig;
  errors?: string[];
} {
  const result = configSchema.safeParse(raw);
  if (result.success) {
    return { valid: true, config: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
  };
}
