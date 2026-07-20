/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProcessedEventModel } from './processed-event.model'
import { ProcessedEventService } from './processed-event.service'

describe('ProcessedEventService', () => {
  let service: ProcessedEventService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ProcessedEventService()
  })

  describe('isEventProcessed', () => {
    it('retorna false quando o evento é criado com sucesso (novo evento)', async () => {
      vi.spyOn(ProcessedEventModel, 'create').mockResolvedValueOnce({} as any)

      const result = await service.isEventProcessed('event-123')

      expect(result).toBe(false)
      expect(ProcessedEventModel.create).toHaveBeenCalledWith({
        eventId: 'event-123',
      })
    })

    it('retorna true quando ocorre erro de chave duplicada (código 11000)', async () => {
      const duplicateError = new Error('Duplicate key')
      ;(duplicateError as any).code = 11000

      vi.spyOn(ProcessedEventModel, 'create').mockRejectedValueOnce(
        duplicateError,
      )

      const result = await service.isEventProcessed('event-123')

      expect(result).toBe(true)
    })

    it('lança o erro quando ocorre qualquer outro erro no banco', async () => {
      const genericError = new Error('Database connection failed')

      vi.spyOn(ProcessedEventModel, 'create').mockRejectedValueOnce(
        genericError,
      )

      await expect(service.isEventProcessed('event-123')).rejects.toThrow(
        genericError,
      )
    })
  })
})
