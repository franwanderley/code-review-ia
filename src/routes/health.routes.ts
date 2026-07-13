import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { Router } from 'express'
import { z } from 'zod'

import { registry } from '../shared/validation/registry'

extendZodWithOpenApi(z)

const healthRouter = Router()

const HealthResponseSchema = z
  .object({
    status: z.string().openapi({ example: 'ok' }),
  })
  .openapi('HealthResponse')

registry.register('HealthResponse', HealthResponseSchema)

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Health check',
  description: 'Returns the current operational status of the API.',
  responses: {
    200: {
      description: 'API is running normally.',
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
    },
  },
})

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export { healthRouter }
