import { useState, useEffect } from 'preact/hooks'
import { convertToPolite } from '../lib/api'
import { loadActiveApiKey } from '../lib/storage'

type Status = 'idle' | 'loading' | 'done' | 'error'

export function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadActiveApiKey().then(({ apiKey }) => {
      if (!apiKey) {
        setStatus('error')
        setErrorMsg('尚未設定 API Key，請先前往設定頁面。')
      }
    })
  }, [])

  async function handleConvert() {
    if (!input.trim()) return
    setStatus('loading')
    setOutput('')
    setErrorMsg('')
    try {
      const { apiKey, provider } = await loadActiveApiKey()
      const result = await convertToPolite(input.trim(), apiKey, provider)
      setOutput(result)
      setStatus('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '轉換失敗，請再試一次。')
      setStatus('error')
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openOptions() {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div style={s.container}>
      <header style={s.header}>
        <span style={s.logo}>✉ Polite Mail</span>
        <button onClick={openOptions} style={s.gear} title="設定">
          ⚙
        </button>
      </header>

      <textarea
        style={s.textarea}
        placeholder="貼入你想轉換的文字..."
        value={input}
        onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        rows={5}
      />

      <button
        style={{ ...s.button, opacity: status === 'loading' || !input.trim() ? 0.6 : 1 }}
        onClick={handleConvert}
        disabled={status === 'loading' || !input.trim()}
      >
        {status === 'loading' ? '轉換中...' : '轉換成有禮貌書信'}
      </button>

      {status === 'error' && <p style={s.error}>{errorMsg}</p>}

      {output && (
        <div style={s.outputBlock}>
          <div style={s.outputHeader}>
            <span style={s.outputLabel}>轉換結果</span>
            <button onClick={handleCopy} style={s.copyBtn}>
              {copied ? '✓ 已複製' : '複製'}
            </button>
          </div>
          <div style={s.output}>{output}</div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, Record<string, string | number>> = {
  container: {
    width: '360px',
    fontFamily: 'system-ui, sans-serif',
    padding: '16px',
    color: '#1a1a1a',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  logo: {
    fontSize: '15px',
    fontWeight: '600',
  },
  gear: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
    color: '#6b7280',
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '13px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    resize: 'vertical',
    fontFamily: 'system-ui, sans-serif',
    boxSizing: 'border-box',
    marginBottom: '10px',
  },
  button: {
    width: '100%',
    padding: '9px',
    fontSize: '14px',
    fontWeight: '500',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  error: {
    fontSize: '12px',
    color: '#dc2626',
    margin: '0 0 10px',
  },
  outputBlock: {
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  outputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 10px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  outputLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
  },
  copyBtn: {
    fontSize: '12px',
    padding: '2px 8px',
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#374151',
  },
  output: {
    padding: '10px',
    fontSize: '13px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    maxHeight: '200px',
    overflowY: 'auto',
  },
}
