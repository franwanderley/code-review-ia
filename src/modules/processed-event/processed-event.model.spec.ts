import { describe, expect, it } from 'vitest'

import { ProcessedEventModel } from './processed-event.model'

describe('ProcessedEventModel', () => {
  describe('validação de campos obrigatórios', () => {
    it('lança erro de validação quando eventId não é informado', async () => {
      const event = new ProcessedEventModel({})

      await expect(event.validate()).rejects.toMatchObject({
        errors: expect.objectContaining({ eventId: expect.anything() }),
      })
    })

    it('não lança erro de validação quando eventId é informado', async () => {
      const event = new ProcessedEventModel({
        eventId: 'github-delivery-abc123',
      })

      await expect(event.validate()).resolves.toBeUndefined()
    })
  })

  describe('valores padrão', () => {
    it('define createdAt como data atual quando não informado', () => {
      const before = new Date()
      const event = new ProcessedEventModel({
        eventId: 'github-delivery-abc123',
      })
      const after = new Date()

      expect(event.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(event.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })
})
