import { useState, useEffect } from 'preact/hooks'
import { saveApiKey, loadApiKey } from '../lib/storage'

export function App() {
  const [apiKey, setApiKey] = useState('')
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    loadApiKey().then(setApiKey)
  }, [])

  async function handleSave(e: Event) {
    e.preventDefault()
    try {
      await saveApiKey(apiKey.trim())
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Polite Mail 設定</h1>
      <form onSubmit={handleSave} style={styles.form}>
        <label style={styles.label} htmlFor="apiKey">
          Claude API Key
        </label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
          placeholder="sk-ant-..."
          style={styles.input}
          spellcheck={false}
        />
        <p style={styles.hint}>
          前往{' '}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
            Anthropic Console
          </a>{' '}
          取得 API key。
        </p>
        <button type="submit" style={styles.button}>
          儲存
        </button>
        {status === 'saved' && <p style={styles.success}>✓ 已儲存</p>}
        {status === 'error' && <p style={styles.errorMsg}>儲存失敗，請再試一次。</p>}
      </form>
    </div>
  )
}

const styles: Record<string, string | Record<string, string>> = {
  container: {
    fontFamily: 'system-ui, sans-serif',
    maxWidth: '480px',
    margin: '48px auto',
    padding: '0 24px',
    color: '#1a1a1a',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0',
  },
  button: {
    marginTop: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  success: {
    fontSize: '13px',
    color: '#16a34a',
    margin: '0',
  },
  errorMsg: {
    fontSize: '13px',
    color: '#dc2626',
    margin: '0',
  },
}
