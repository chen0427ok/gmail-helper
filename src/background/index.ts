import { convertToPolite } from '../lib/claude'
import { loadApiKey } from '../lib/storage'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'polite-mail',
    title: '轉換成有禮貌書信',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'polite-mail' || !tab?.id) return

  const selectedText = info.selectionText?.trim()
  if (!selectedText) return

  const tabId = tab.id
  const ready = await ensureContentScript(tabId)
  if (!ready) return

  safeSend(tabId, { type: 'CONVERT_START' })

  try {
    const apiKey = await loadApiKey()
    const result = await convertToPolite(selectedText, apiKey)
    safeSend(tabId, { type: 'CONVERT_DONE', original: selectedText, result })
  } catch (e) {
    const message = e instanceof Error ? e.message : '轉換失敗，請再試一次。'
    safeSend(tabId, { type: 'CONVERT_ERROR', message })
  }
})

// Returns true if content script is ready to receive messages
async function ensureContentScript(tabId: number): Promise<boolean> {
  // Check if already loaded
  if (await ping(tabId)) return true

  // Inject and wait for it to be ready
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/index.js'],
    })
  } catch {
    return false
  }

  // Retry ping up to 10 times (500ms total)
  for (let i = 0; i < 10; i++) {
    await sleep(50)
    if (await ping(tabId)) return true
  }

  return false
}

async function ping(tabId: number): Promise<boolean> {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: 'PING' })
    return res?.ok === true
  } catch {
    return false
  }
}

function safeSend(tabId: number, message: object) {
  chrome.tabs.sendMessage(tabId, message).catch(() => {})
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
