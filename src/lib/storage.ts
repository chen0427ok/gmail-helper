export type Provider = 'claude' | 'openai' | 'gemini'

export interface ModelOption {
  value: string
  label: string
}

export const MODELS: Record<Provider, ModelOption[]> = {
  claude: [
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
  ],
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  ],
}

export interface Settings {
  provider: Provider
  claudeModel: string
  openaiModel: string
  geminiModel: string
  claudeApiKey: string
  openaiApiKey: string
  geminiApiKey: string
}

const DEFAULT_SETTINGS: Settings = {
  provider: 'claude',
  claudeModel: MODELS.claude[0].value,
  openaiModel: MODELS.openai[0].value,
  geminiModel: MODELS.gemini[0].value,
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

export async function loadActiveApiKey(): Promise<{ apiKey: string; provider: Provider; model: string }> {
  const settings = await loadSettings()
  const keyMap: Record<Provider, string> = {
    claude: settings.claudeApiKey,
    openai: settings.openaiApiKey,
    gemini: settings.geminiApiKey,
  }
  const modelMap: Record<Provider, string> = {
    claude: settings.claudeModel,
    openai: settings.openaiModel,
    gemini: settings.geminiModel,
  }
  return { apiKey: keyMap[settings.provider], provider: settings.provider, model: modelMap[settings.provider] }
}
