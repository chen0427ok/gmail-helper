const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

export async function convertToPolite(text: string, apiKey: string): Promise<string> {
  if (!apiKey) throw new Error('API key is required')
  if (!text) throw new Error('Text is required')

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
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
  return data.content[0].text
}
