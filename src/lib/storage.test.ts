import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveSettings, loadSettings, loadActiveApiKey } from './storage'

// In-memory store that backs the chrome.storage.local mock
const store: Record<string, unknown> = {}

vi.stubGlobal('chrome', {
  storage: {
    local: {
      set: vi.fn(async (data: Record<string, unknown>) => {
        Object.assign(store, data)
      }),
      get: vi.fn(async (keys: string[]) =>
        Object.fromEntries(
          keys.flatMap((k) => (k in store ? [[k, store[k]]] : [])),
        ),
      ),
    },
  },
})

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k])
  vi.clearAllMocks()
})

// ── loadSettings ──────────────────────────────────────────────────────────────

describe('loadSettings', () => {
  it('returns defaults when nothing is saved', async () => {
    const settings = await loadSettings()
    expect(settings).toEqual({
      provider: 'claude',
      claudeApiKey: '',
      openaiApiKey: '',
      geminiApiKey: '',
    })
  })

  it('merges saved values over defaults', async () => {
    store.provider = 'openai'
    store.openaiApiKey = 'sk-saved'
    const settings = await loadSettings()
    expect(settings.provider).toBe('openai')
    expect(settings.openaiApiKey).toBe('sk-saved')
    expect(settings.claudeApiKey).toBe('')
    expect(settings.geminiApiKey).toBe('')
  })

  it('returns all four fields', async () => {
    const settings = await loadSettings()
    expect(Object.keys(settings)).toEqual(
      expect.arrayContaining(['provider', 'claudeApiKey', 'openaiApiKey', 'geminiApiKey']),
    )
  })
})

// ── saveSettings ──────────────────────────────────────────────────────────────

describe('saveSettings', () => {
  it('passes the provided fields to chrome.storage.local.set', async () => {
    await saveSettings({ provider: 'gemini', geminiApiKey: 'gm-key' })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      provider: 'gemini',
      geminiApiKey: 'gm-key',
    })
  })

  it('persists values that are then readable by loadSettings', async () => {
    await saveSettings({ provider: 'openai', openaiApiKey: 'sk-test' })
    const settings = await loadSettings()
    expect(settings.provider).toBe('openai')
    expect(settings.openaiApiKey).toBe('sk-test')
  })
})

// ── loadActiveApiKey ──────────────────────────────────────────────────────────

describe('loadActiveApiKey', () => {
  it('returns the claude key when provider is claude', async () => {
    store.provider = 'claude'
    store.claudeApiKey = 'sk-ant-test'
    const { apiKey, provider } = await loadActiveApiKey()
    expect(apiKey).toBe('sk-ant-test')
    expect(provider).toBe('claude')
  })

  it('returns the openai key when provider is openai', async () => {
    store.provider = 'openai'
    store.openaiApiKey = 'sk-openai'
    const { apiKey, provider } = await loadActiveApiKey()
    expect(apiKey).toBe('sk-openai')
    expect(provider).toBe('openai')
  })

  it('returns the gemini key when provider is gemini', async () => {
    store.provider = 'gemini'
    store.geminiApiKey = 'gm-key'
    const { apiKey, provider } = await loadActiveApiKey()
    expect(apiKey).toBe('gm-key')
    expect(provider).toBe('gemini')
  })

  it('returns empty string when key is not configured', async () => {
    const { apiKey, provider } = await loadActiveApiKey()
    expect(apiKey).toBe('')
    expect(provider).toBe('claude')
  })
})
