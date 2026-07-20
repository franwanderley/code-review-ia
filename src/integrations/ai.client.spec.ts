/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppError } from '../shared/errors/AppError'
import { AIClient } from './ai.client'

describe('AIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NARA_ROUTER_API_KEY = 'test-key'
    process.env.NARA_ROUTER_BASE_URL = 'https://api.test.com'
    global.fetch = vi.fn()
  })

  afterEach(() => {
    delete process.env.NARA_ROUTER_API_KEY
    delete process.env.NARA_ROUTER_BASE_URL
  })

  describe('initialization', () => {
    it('lança erro se NARA_ROUTER_API_KEY não estiver definida ao tentar analisar', async () => {
      delete process.env.NARA_ROUTER_API_KEY
      const client = new AIClient()
      await expect(client.analyzePullRequest('diff')).rejects.toThrow(AppError)
      await expect(client.analyzePullRequest('diff')).rejects.toThrow(
        'NARA_ROUTER_API_KEY',
      )
    })

    it('lança erro se NARA_ROUTER_BASE_URL não estiver definida ao tentar analisar', async () => {
      delete process.env.NARA_ROUTER_BASE_URL
      const client = new AIClient()
      await expect(client.analyzePullRequest('diff')).rejects.toThrow(AppError)
      await expect(client.analyzePullRequest('diff')).rejects.toThrow(
        'NARA_ROUTER_BASE_URL',
      )
    })
  })

  describe('analyzePullRequest', () => {
    it('retorna um array de sugestões vazio quando a API não encontra problemas', async () => {
      const client = new AIClient()

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '[]' } }],
        }),
      }
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const result = await client.analyzePullRequest('diff content')

      expect(result).toEqual([])
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        }),
      )
    })

    it('retorna um array de sugestões parseado corretamente', async () => {
      const client = new AIClient()

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content:
                  '```json\n[{"file":"test.ts","line":1,"severity":"info","message":"msg","suggestion":"sug"}]\n```',
              },
            },
          ],
        }),
      }
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const result = await client.analyzePullRequest('diff content')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        file: 'test.ts',
        line: 1,
        severity: 'info',
        message: 'msg',
        suggestion: 'sug',
      })
    })

    it('extrai as sugestões de um objeto pai se o response_format encapsular', async () => {
      const client = new AIClient()

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content:
                  '{"suggestions": [{"file":"test.ts","line":1,"severity":"info","message":"msg","suggestion":"sug"}]}',
              },
            },
          ],
        }),
      }
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const result = await client.analyzePullRequest('diff content')

      expect(result).toHaveLength(1)
      expect(result[0].file).toBe('test.ts')
    })

    it('lança AppError quando a API retorna erro (status não ok)', async () => {
      const client = new AIClient()

      const mockResponse = {
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Bad Request'),
      }
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      await expect(client.analyzePullRequest('diff')).rejects.toThrow(AppError)
      await expect(client.analyzePullRequest('diff')).rejects.toThrow(
        'AI API returned status 400: Bad Request',
      )
    })

    it('lança AppError quando a API retorna um JSON inválido (parser error)', async () => {
      const client = new AIClient()

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'This is not json' } }],
        }),
      }
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      await expect(client.analyzePullRequest('diff')).rejects.toThrow(AppError)
      await expect(client.analyzePullRequest('diff')).rejects.toThrow(
        'Failed to parse AI response as JSON',
      )
    })

    it('lança AppError para erros genéricos de rede', async () => {
      const client = new AIClient()

      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      await expect(client.analyzePullRequest('diff')).rejects.toThrow(AppError)
      await expect(client.analyzePullRequest('diff')).rejects.toThrow(
        'Failed to communicate with AI API: Network error',
      )
    })
  })
})
