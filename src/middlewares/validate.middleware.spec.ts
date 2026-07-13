import { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { validate } from './validate.middleware'

const buildMocks = () => {
  const req = { body: {}, params: {}, query: {} } as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  const next = vi.fn() as NextFunction
  return { req, res, next }
}

describe('validate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validação de body', () => {
    const schema = z.object({ name: z.string() })

    it('chama next quando o body é válido', async () => {
      const { req, res, next } = buildMocks()
      req.body = { name: 'franwanderley' }

      await validate(schema)(req, res, next)

      expect(next).toHaveBeenCalledOnce()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('retorna 400 quando o body é inválido', async () => {
      const { req, res, next } = buildMocks()
      req.body = { name: 123 }

      await validate(schema)(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('retorna mensagem e lista de erros no body de resposta 400', async () => {
      const { req, res, next } = buildMocks()
      req.body = {}

      await validate(schema)(req, res, next)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'name', message: expect.any(String) }),
          ]),
        }),
      )
    })

    it('substitui req.body pelos dados parseados quando válido', async () => {
      const { req, res, next } = buildMocks()
      req.body = { name: '  franwanderley  ', extra: 'stripped' }

      const trimSchema = z.object({ name: z.string().trim() })
      await validate(trimSchema)(req, res, next)

      expect(req.body.name).toBe('franwanderley')
    })
  })

  describe('validação de query', () => {
    const schema = z.object({ page: z.string() })

    it('chama next quando query é válida', async () => {
      const { req, res, next } = buildMocks()
      req.query = { page: '1' }

      await validate(schema, 'query')(req, res, next)

      expect(next).toHaveBeenCalledOnce()
    })

    it('retorna 400 quando query está inválida', async () => {
      const { req, res, next } = buildMocks()
      req.query = {}

      await validate(schema, 'query')(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('validação de params', () => {
    const schema = z.object({ id: z.string().uuid() })

    it('retorna 400 quando param não é um UUID válido', async () => {
      const { req, res, next } = buildMocks()
      req.params = { id: 'not-a-uuid' }

      await validate(schema, 'params')(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(next).not.toHaveBeenCalled()
    })
  })
})
