export type Provider = 'claude' | 'openai' | 'gemini'

export interface Settings {
  provider: Provider
  claudeApiKey: string
  openaiApiKey: string
  geminiApiKey: string
}

const DEFAULT_SETTINGS: Settings = {
  provider: 'claude',
  claudeApiKey: '',
  openaiApiKey: '',
  geminiApiKey: '',
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set(settings)
}

export async function loadSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS))
  return { ...DEFAULT_SETTINGS, ...result } as Settings
}

// Convenience: get the active API key for the current provider
export async function loadActiveApiKey(): Promise<{ apiKey: string; provider: Provider }> {
  const settings = await loadSettings()
  const keyMap: Record<Provider, string> = {
    claude: settings.claudeApiKey,
    openai: settings.openaiApiKey,
    gemini: settings.geminiApiKey,
  }
  return { apiKey: keyMap[settings.provider], provider: settings.provider }
}
