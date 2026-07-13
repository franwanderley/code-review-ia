import { Schema, model } from 'mongoose'

import { ProcessedEvent } from './processed-event.types'

const processedEventSchema = new Schema<ProcessedEvent>({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d',
  },
})

export const ProcessedEventModel = model<ProcessedEvent>(
  'ProcessedEvent',
  processedEventSchema,
)
