import type { Provider } from './storage'

const PROMPT = (text: string) =>
  `Please rewrite the following text as a polite, formal letter. Keep the same language as the input. Only return the rewritten text, no explanations.\n\n${text}`

export async function convertToPolite(text: string, apiKey: string, provider: Provider): Promise<string> {
  if (!apiKey) throw new Error('尚未設定 API Key，請點右上角齒輪進行設定。')
  if (!text) throw new Error('Text is required')

  switch (provider) {
    case 'claude':  return callClaude(text, apiKey)
    case 'openai':  return callOpenAI(text, apiKey)
    case 'gemini':  return callGemini(text, apiKey)
  }
}

// ── Claude (Anthropic) ────────────────────────────────────────────────────────

async function callClaude(text: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: PROMPT(text) }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `Claude API 錯誤（${res.status}）`)
  return data.content[0].text
}

// ── OpenAI ────────────────────────────────────────────────────────────────────

async function callOpenAI(text: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: PROMPT(text) }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `OpenAI API 錯誤（${res.status}）`)
  return data.choices[0].message.content
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function callGemini(text: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT(text) }] }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `Gemini API 錯誤（${res.status}）`)
  return data.candidates[0].content.parts[0].text
}
