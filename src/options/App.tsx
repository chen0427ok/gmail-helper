import { useState, useEffect } from 'preact/hooks'
import { saveSettings, loadSettings, MODELS } from '../lib/storage'
import type { Provider } from '../lib/storage'

const PROVIDERS: { value: Provider; label: string; placeholder: string }[] = [
  { value: 'claude', label: 'Claude (Anthropic)', placeholder: 'sk-ant-...' },
  { value: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { value: 'gemini', label: 'Gemini (Google)', placeholder: 'AIza...' },
]

export function App() {
  const [provider, setProvider] = useState<Provider>('claude')
  const [keys, setKeys] = useState({ claudeApiKey: '', openaiApiKey: '', geminiApiKey: '' })
  const [models, setModels] = useState({
    claudeModel: MODELS.claude[0].value,
    openaiModel: MODELS.openai[0].value,
    geminiModel: MODELS.gemini[0].value,
  })
  const [status, setStatus] = useState<'idle' | 'saved'>('idle')

  useEffect(() => {
    loadSettings().then((s) => {
      setProvider(s.provider)
      setKeys({ claudeApiKey: s.claudeApiKey, openaiApiKey: s.openaiApiKey, geminiApiKey: s.geminiApiKey })
      setModels({ claudeModel: s.claudeModel, openaiModel: s.openaiModel, geminiModel: s.geminiModel })
    })
  }, [])

  const activeKeyField = provider === 'claude' ? 'claudeApiKey' : provider === 'openai' ? 'openaiApiKey' : 'geminiApiKey'
  const activeModelField = provider === 'claude' ? 'claudeModel' : provider === 'openai' ? 'openaiModel' : 'geminiModel'
  const activePlaceholder = PROVIDERS.find((p) => p.value === provider)!.placeholder

  async function handleSave(e: Event) {
    e.preventDefault()
    await saveSettings({ provider, ...keys, ...models })
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div style={s.container}>
      <h1 style={s.title}>Polite Mail 設定</h1>

      <form onSubmit={handleSave} style={s.form}>
        {/* Provider selector */}
        <label style={s.label}>AI 服務</label>
        <div style={s.radioGroup}>
          {PROVIDERS.map((p) => (
            <label key={p.value} style={s.radioLabel}>
              <input
                type="radio"
                name="provider"
                value={p.value}
                checked={provider === p.value}
                onChange={() => setProvider(p.value)}
                style={{ marginRight: '6px' }}
              />
              {p.label}
            </label>
          ))}
        </div>

        {/* Model selector for active provider */}
        <label style={s.label} htmlFor="model">模型</label>
        <select
          id="model"
          value={models[activeModelField]}
          onChange={(e) => setModels({ ...models, [activeModelField]: (e.target as HTMLSelectElement).value })}
          style={s.select}
        >
          {MODELS[provider].map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* API Key input for active provider */}
        <label style={s.label} htmlFor="apiKey">API Key</label>
        <input
          id="apiKey"
          type="password"
          value={keys[activeKeyField]}
          onInput={(e) =>
            setKeys({ ...keys, [activeKeyField]: (e.target as HTMLInputElement).value })
          }
          placeholder={activePlaceholder}
          style={s.input}
          spellcheck={false}
        />

        <p style={s.hint}>
          {provider === 'claude' && <>前往 <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">Anthropic Console</a> 取得 API Key</>}
          {provider === 'openai' && <>前往 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI Platform</a> 取得 API Key</>}
          {provider === 'gemini' && <>前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Google AI Studio</a> 取得 API Key</>}
        </p>

        <button type="submit" style={s.button}>儲存</button>
        {status === 'saved' && <p style={s.success}>✓ 已儲存</p>}
      </form>
    </div>
  )
}

const s: Record<string, Record<string, string | number>> = {
  container: { fontFamily: 'system-ui, sans-serif', maxWidth: '480px', margin: '48px auto', padding: '0 24px', color: '#1a1a1a' },
  title: { fontSize: '20px', fontWeight: '600', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '500' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '4px' },
  radioLabel: { fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  select: { padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', background: '#fff', cursor: 'pointer' },
  input: { padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', fontFamily: 'monospace' },
  hint: { fontSize: '12px', color: '#6b7280', margin: '0' },
  button: { marginTop: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '500', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', alignSelf: 'flex-start' },
  success: { fontSize: '13px', color: '#16a34a', margin: '0' },
}
