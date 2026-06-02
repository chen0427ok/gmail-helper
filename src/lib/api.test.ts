import { describe, it, expect, vi, beforeEach } from 'vitest'
import { convertToPolite, withRetry, ApiError } from './api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ── Guard checks ──────────────────────────────────────────────────────────────

describe('convertToPolite – guards', () => {
  it('throws when apiKey is empty', async () => {
    await expect(convertToPolite('hello', '', 'claude', 'claude-haiku-4-5-20251001')).rejects.toThrow('尚未設定 API Key')
  })

  it('throws when text is empty', async () => {
    await expect(convertToPolite('', 'key', 'claude', 'claude-haiku-4-5-20251001')).rejects.toThrow('Text is required')
  })
})

// ── Claude ────────────────────────────────────────────────────────────────────

describe('convertToPolite – claude', () => {
  it('returns converted text on success', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ content: [{ text: 'Polite version' }] }))
    const result = await convertToPolite('hello', 'sk-ant-test', 'claude', 'claude-haiku-4-5-20251001')
    expect(result).toBe('Polite version')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-api-key': 'sk-ant-test' }),
      }),
    )
  })

  it('sends the specified model in the request body', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ content: [{ text: 'x' }] }))
    await convertToPolite('hello', 'key', 'claude', 'claude-sonnet-4-6')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.model).toBe('claude-sonnet-4-6')
    expect(body.max_tokens).toBe(1024)
  })

  it('throws ApiError on 4xx and does not retry', async () => {
    mockFetch.mockResolvedValue(makeResponse({ error: { message: 'Invalid API key' } }, 401))
    await expect(convertToPolite('hello', 'bad-key', 'claude', 'claude-haiku-4-5-20251001')).rejects.toMatchObject({
      message: 'Invalid API key',
      status: 401,
    })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('uses fallback message when error body lacks message field', async () => {
    mockFetch.mockResolvedValue(makeResponse({}, 401))
    await expect(convertToPolite('hello', 'key', 'claude', 'claude-haiku-4-5-20251001')).rejects.toMatchObject({
      message: 'Claude API 錯誤（401）',
    })
  })
})

// ── OpenAI ────────────────────────────────────────────────────────────────────

describe('convertToPolite – openai', () => {
  it('returns converted text on success', async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({ choices: [{ message: { content: 'Polite' } }] }),
    )
    const result = await convertToPolite('hi', 'sk-openai', 'openai', 'gpt-4o-mini')
    expect(result).toBe('Polite')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer sk-openai' }),
      }),
    )
  })

  it('sends the specified model in the request body', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ choices: [{ message: { content: 'x' } }] }))
    await convertToPolite('hi', 'key', 'openai', 'gpt-4o')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.model).toBe('gpt-4o')
  })

  it('throws ApiError on 4xx and does not retry', async () => {
    mockFetch.mockResolvedValue(makeResponse({ error: { message: 'Rate limit' } }, 429))
    await expect(convertToPolite('hi', 'sk-openai', 'openai', 'gpt-4o-mini')).rejects.toMatchObject({ status: 429 })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

// ── Gemini ────────────────────────────────────────────────────────────────────

describe('convertToPolite – gemini', () => {
  it('returns converted text on success', async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({ candidates: [{ content: { parts: [{ text: 'Polished' }] } }] }),
    )
    const result = await convertToPolite('hey', 'gm-key', 'gemini', 'gemini-2.5-flash')
    expect(result).toBe('Polished')
  })

  it('includes model name and API key in URL', async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse({ candidates: [{ content: { parts: [{ text: 'x' }] } }] }),
    )
    await convertToPolite('hey', 'my-secret-key', 'gemini', 'gemini-2.0-flash')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('gemini-2.0-flash'),
      expect.any(Object),
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('key=my-secret-key'),
      expect.any(Object),
    )
  })

  it('throws ApiError on 4xx and does not retry', async () => {
    mockFetch.mockResolvedValue(makeResponse({ error: { message: 'Bad key' } }, 400))
    await expect(convertToPolite('hey', 'bad', 'gemini', 'gemini-2.5-flash')).rejects.toMatchObject({ status: 400 })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

// ── withRetry ─────────────────────────────────────────────────────────────────

describe('withRetry', () => {
  it('returns immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    expect(await withRetry(fn, 3, 0)).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on 5xx error and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ApiError('server error', 500))
      .mockResolvedValueOnce('recovered')
    expect(await withRetry(fn, 3, 0)).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on network error (TypeError) up to maxAttempts', async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(withRetry(fn, 3, 0)).rejects.toThrow('Failed to fetch')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry on 4xx ApiError', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('Unauthorized', 401))
    await expect(withRetry(fn, 3, 0)).rejects.toMatchObject({ status: 401 })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not retry on 499 (last 4xx)', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('Too Many Requests', 499))
    await expect(withRetry(fn, 3, 0)).rejects.toMatchObject({ status: 499 })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on 500 (first 5xx)', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ApiError('Internal Server Error', 500))
      .mockResolvedValueOnce('done')
    expect(await withRetry(fn, 3, 0)).toBe('done')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('exhausts all attempts and throws last error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ApiError('err 1', 503))
      .mockRejectedValueOnce(new ApiError('err 2', 503))
      .mockRejectedValueOnce(new ApiError('err 3', 503))
    await expect(withRetry(fn, 3, 0)).rejects.toMatchObject({ message: 'err 3' })
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('wraps non-Error throws in Error', async () => {
    const fn = vi.fn().mockImplementation(() => { throw 'string error' })
    await expect(withRetry(fn, 1, 0)).rejects.toThrow('string error')
  })
})

// ── ApiError ──────────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('has correct name, message and status', () => {
    const err = new ApiError('oops', 503)
    expect(err.name).toBe('ApiError')
    expect(err.message).toBe('oops')
    expect(err.status).toBe(503)
    expect(err instanceof Error).toBe(true)
  })
})
