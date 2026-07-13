import { ProcessedEventModel } from './processed-event.model'

const ERROR_COINSTRANT_DUPLICATE_KEY = 11000

export class ProcessedEventService {
  /**
   * Verifica se um evento já foi processado. Se não foi, registra e retorna false.
   * Se já foi, retorna true.
   * Usado para garantir idempotência de webhooks.
   *
   * @param eventId O ID único do evento (ex: x-github-delivery header)
   * @returns true se já processado, false caso contrário
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    try {
      await ProcessedEventModel.create({ eventId })
      return false
    } catch (error: unknown) {
      if (
        (error as { code?: number })?.code === ERROR_COINSTRANT_DUPLICATE_KEY
      ) {
        return true
      }
      throw error
    }
  }
}
