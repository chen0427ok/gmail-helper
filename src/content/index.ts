type SavedSelection =
  | { type: 'input'; element: HTMLTextAreaElement | HTMLInputElement; start: number; end: number }
  | { type: 'contenteditable'; element: HTMLElement; range: Range }

let savedSelection: SavedSelection | null = null

// Save selection state at the moment of right-click
document.addEventListener('contextmenu', () => {
  const el = document.activeElement

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    savedSelection = {
      type: 'input',
      element: el,
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    }
    return
  }

  if (el instanceof HTMLElement && el.isContentEditable) {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedSelection = {
        type: 'contenteditable',
        element: el,
        range: selection.getRangeAt(0).cloneRange(),
      }
    }
  }
})

// ── Messages from background ──────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'PING') { sendResponse({ ok: true }); return }
  if (msg.type === 'CONVERT_START') showLoading()
  if (msg.type === 'CONVERT_DONE') showModal(msg.original as string, msg.result as string)
  if (msg.type === 'CONVERT_ERROR') showError(msg.message as string)
})

// ── Loading toast ─────────────────────────────────────────────────────────────

let loadingEl: HTMLElement | null = null

function showLoading() {
  removeLoading()
  loadingEl = document.createElement('div')
  loadingEl.id = 'polite-mail-loading'
  loadingEl.textContent = '✉ 轉換中...'
  Object.assign(loadingEl.style, toastStyle)
  document.body.appendChild(loadingEl)
}

function removeLoading() {
  loadingEl?.remove()
  loadingEl = null
}

// ── Error toast ───────────────────────────────────────────────────────────────

function showError(message: string) {
  removeLoading()
  const el = document.createElement('div')
  Object.assign(el.style, { ...toastStyle, background: '#dc2626' })
  el.textContent = `✉ ${message}`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 4000)
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

function showModal(original: string, result: string) {
  removeLoading()

  const overlay = document.createElement('div')
  overlay.id = 'polite-mail-overlay'
  Object.assign(overlay.style, overlayStyle)

  const modal = document.createElement('div')
  Object.assign(modal.style, modalStyle)
  modal.innerHTML = `
    <h3 style="margin:0 0 12px;font-size:15px;font-weight:600;">✉ 轉換結果確認</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <div>
        <p style="${labelStyle}">原文</p>
        <div style="${boxStyle} color:#6b7280;">${escapeHtml(original)}</div>
      </div>
      <div>
        <p style="${labelStyle}">轉換後</p>
        <div style="${boxStyle} color:#1a1a1a;">${escapeHtml(result)}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;">
      <button id="pm-cancel" style="${cancelBtnStyle}">取消</button>
      <button id="pm-confirm" style="${confirmBtnStyle}">確認取代</button>
    </div>
  `

  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup()
  })

  modal.querySelector('#pm-cancel')!.addEventListener('click', cleanup)

  modal.querySelector('#pm-confirm')!.addEventListener('click', () => {
    replaceText(result)
    cleanup()
  })
}

function cleanup() {
  document.getElementById('polite-mail-overlay')?.remove()
}

// ── Text replacement ──────────────────────────────────────────────────────────

function replaceText(newText: string) {
  if (!savedSelection) return

  if (savedSelection.type === 'input') {
    const el = savedSelection.element
    const { start, end } = savedSelection
    const before = el.value.slice(0, start)
    const after = el.value.slice(end)
    el.focus()
    el.setSelectionRange(start, end)
    // Use execCommand so undo (Ctrl+Z) works in the browser
    document.execCommand('insertText', false, newText)
    if (el.value !== before + newText + after) {
      // Fallback if execCommand not supported
      el.value = before + newText + after
      el.setSelectionRange(start, start + newText.length)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    return
  }

  if (savedSelection.type === 'contenteditable') {
    const selection = window.getSelection()
    if (!selection) return
    selection.removeAllRanges()
    selection.addRange(savedSelection.range)
    document.execCommand('insertText', false, newText)
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const toastStyle: Partial<CSSStyleDeclaration> = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  zIndex: '2147483647',
  background: '#4f46e5',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontFamily: 'system-ui, sans-serif',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
}

const overlayStyle: Partial<CSSStyleDeclaration> = {
  position: 'fixed',
  inset: '0',
  zIndex: '2147483646',
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const modalStyle: Partial<CSSStyleDeclaration> = {
  background: '#fff',
  borderRadius: '10px',
  padding: '20px',
  width: '560px',
  maxWidth: '90vw',
  fontFamily: 'system-ui, sans-serif',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
}

const labelStyle = 'margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;'
const boxStyle = 'background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;font-size:13px;line-height:1.6;white-space:pre-wrap;max-height:160px;overflow-y:auto;'
const cancelBtnStyle = 'padding:7px 14px;font-size:13px;background:none;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;color:#374151;'
const confirmBtnStyle = 'padding:7px 14px;font-size:13px;background:#4f46e5;border:none;border-radius:6px;cursor:pointer;color:#fff;font-weight:500;'

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
}
