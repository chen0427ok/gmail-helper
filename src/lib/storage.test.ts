import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveSettings, loadSettings, loadActiveApiKey, MODELS } from './storage'

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
      claudeModel: MODELS.claude[0].value,
      openaiModel: MODELS.openai[0].value,
      geminiModel: MODELS.gemini[0].value,
      claudeApiKey: '',
      openaiApiKey: '',
      geminiApiKey: '',
    })
  })

  it('merges saved values over defaults', async () => {
    store.provider = 'openai'
    store.openaiApiKey = 'sk-saved'
    store.openaiModel = 'gpt-4o'
    const settings = await loadSettings()
    expect(settings.provider).toBe('openai')
    expect(settings.openaiApiKey).toBe('sk-saved')
    expect(settings.openaiModel).toBe('gpt-4o')
    expect(settings.claudeApiKey).toBe('')
    expect(settings.claudeModel).toBe(MODELS.claude[0].value)
  })

  it('returns all expected fields', async () => {
    const settings = await loadSettings()
    expect(Object.keys(settings)).toEqual(
      expect.arrayContaining([
        'provider', 'claudeModel', 'openaiModel', 'geminiModel',
        'claudeApiKey', 'openaiApiKey', 'geminiApiKey',
      ]),
    )
  })
})

// ── saveSettings ──────────────────────────────────────────────────────────────

describe('saveSettings', () => {
  it('passes the provided fields to chrome.storage.local.set', async () => {
    await saveSettings({ provider: 'gemini', geminiApiKey: 'gm-key', geminiModel: 'gemini-2.0-flash' })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      provider: 'gemini',
      geminiApiKey: 'gm-key',
      geminiModel: 'gemini-2.0-flash',
    })
  })

  it('persists values that are then readable by loadSettings', async () => {
    await saveSettings({ provider: 'openai', openaiApiKey: 'sk-test', openaiModel: 'gpt-4o' })
    const settings = await loadSettings()
    expect(settings.provider).toBe('openai')
    expect(settings.openaiApiKey).toBe('sk-test')
    expect(settings.openaiModel).toBe('gpt-4o')
  })
})

// ── loadActiveApiKey ──────────────────────────────────────────────────────────

describe('loadActiveApiKey', () => {
  it('returns claude key and model when provider is claude', async () => {
    store.provider = 'claude'
    store.claudeApiKey = 'sk-ant-test'
    store.claudeModel = 'claude-sonnet-4-6'
    const { apiKey, provider, model } = await loadActiveApiKey()
    expect(apiKey).toBe('sk-ant-test')
    expect(provider).toBe('claude')
    expect(model).toBe('claude-sonnet-4-6')
  })

  it('returns openai key and model when provider is openai', async () => {
    store.provider = 'openai'
    store.openaiApiKey = 'sk-openai'
    store.openaiModel = 'gpt-4o'
    const { apiKey, provider, model } = await loadActiveApiKey()
    expect(apiKey).toBe('sk-openai')
    expect(provider).toBe('openai')
    expect(model).toBe('gpt-4o')
  })

  it('returns gemini key and model when provider is gemini', async () => {
    store.provider = 'gemini'
    store.geminiApiKey = 'gm-key'
    store.geminiModel = 'gemini-2.0-flash'
    const { apiKey, provider, model } = await loadActiveApiKey()
    expect(apiKey).toBe('gm-key')
    expect(provider).toBe('gemini')
    expect(model).toBe('gemini-2.0-flash')
  })

  it('returns defaults when nothing is configured', async () => {
    const { apiKey, provider, model } = await loadActiveApiKey()
    expect(apiKey).toBe('')
    expect(provider).toBe('claude')
    expect(model).toBe(MODELS.claude[0].value)
  })
})

// ── MODELS constant ───────────────────────────────────────────────────────────

describe('MODELS', () => {
  it('has entries for all three providers', () => {
    expect(MODELS.claude.length).toBeGreaterThan(0)
    expect(MODELS.openai.length).toBeGreaterThan(0)
    expect(MODELS.gemini.length).toBeGreaterThan(0)
  })

  it('each entry has value and label', () => {
    for (const options of Object.values(MODELS)) {
      for (const opt of options) {
        expect(opt.value).toBeTruthy()
        expect(opt.label).toBeTruthy()
      }
    }
  })
})
