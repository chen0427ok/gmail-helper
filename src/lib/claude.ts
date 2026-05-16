const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

export async function convertToPolite(text: string, apiKey: string): Promise<string> {
  if (!apiKey) throw new Error('尚未設定 API Key，請點右上角齒輪進行設定。')
  if (!text) throw new Error('Text is required')

  const response = await fetch(CLAUDE_API_URL, {
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
      messages: [
        {
          role: 'user',
          content: `Please rewrite the following text as a polite, formal letter. Keep the same language as the input. Only return the rewritten text, no explanations.\n\n${text}`,
        },
      ],
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    const msg = data?.error?.message ?? `API 錯誤（狀態碼 ${response.status}）`
    throw new Error(msg)
  }

  return data.content[0].text
}
