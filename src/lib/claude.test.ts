import { describe, it, expect, vi, beforeEach } from 'vitest'
import { convertToPolite } from './claude'

describe('convertToPolite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('throws when apiKey is empty', async () => {
    await expect(convertToPolite('hello', '')).rejects.toThrow('API key is required')
  })

  it('throws when text is empty', async () => {
    await expect(convertToPolite('', 'test-api-key')).rejects.toThrow('Text is required')
  })

  it('returns the polite version of the text from Claude', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: '您好，感謝您的來信。' }],
      }),
    })

    const result = await convertToPolite('hi thanks', 'test-api-key')

    expect(result).toBe('您好，感謝您的來信。')
  })
})
