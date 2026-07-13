import { ProcessedEventModel } from './processed-event.model'

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
      // 11000 is the MongoDB error code for duplicate key (unique constraint violation)
      if ((error as { code?: number })?.code === 11000) {
        return true
      }
      throw error
    }
  }
}
