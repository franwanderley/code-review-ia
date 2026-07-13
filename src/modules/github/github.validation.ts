import { z } from 'zod'

export const GithubWebhookPayloadSchema = z
  .object({
    action: z.enum(['opened', 'synchronize', 'reopened', 'closed']).optional(),
    pull_request: z.object({
      number: z.number(),
      state: z.string(),
    }),
    repository: z.object({
      name: z.string(),
      owner: z.object({
        login: z.string(),
      }),
    }),
    sender: z.object({
      login: z.string(),
    }),
  })
  .passthrough()
