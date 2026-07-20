import { Router } from 'express'
import { z } from 'zod'

import { validate } from '../middlewares/validate.middleware'
import { registry } from '../shared/validation/registry'
import { GithubController } from '../modules/github/github.controller'
import { GithubWebhookPayloadSchema } from '../modules/github/github.validation'

const githubRouter = Router()
const githubController = new GithubController()

// OpenAPI Registration
registry.registerPath({
  method: 'post',
  path: '/api/webhooks/github',
  tags: ['Webhooks'],
  summary: 'GitHub Webhook Receiver',
  description:
    'Receives pull_request events from GitHub, validates the payload, and starts the async code review process.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: GithubWebhookPayloadSchema,
        },
      },
    },
  },
  responses: {
    202: {
      description: 'Webhook accepted for processing.',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    200: {
      description: 'Webhook event ignored (not relevant).',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    400: {
      description: 'Invalid webhook payload or missing headers.',
    },
  },
})

// Route Definition
githubRouter.post(
  '/api/webhooks/github',
  validate(GithubWebhookPayloadSchema),
  githubController.handleWebhook,
)

export { githubRouter }
