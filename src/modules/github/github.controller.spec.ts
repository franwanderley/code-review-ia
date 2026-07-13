import { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GithubController } from './github.controller'
import { PullRequestService } from '../pull-request/pull-request.service'

vi.mock('../pull-request/pull-request.service')

const buildMocks = () => {
  const req = { body: {}, headers: {} } as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  const next = vi.fn() as NextFunction
  return { req, res, next }
}

describe('GithubController', () => {
  let controller: GithubController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new GithubController()
  })

  describe('handleWebhook', () => {
    it('retorna 400 se o header x-github-delivery não for fornecido', async () => {
      const { req, res } = buildMocks()
      req.headers['x-github-event'] = 'pull_request'

      await controller.handleWebhook(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing x-github-delivery header',
      })
    })

    it('retorna 200 e ignora eventos que não são pull_request', async () => {
      const { req, res } = buildMocks()
      req.headers['x-github-delivery'] = 'delivery-123'
      req.headers['x-github-event'] = 'push'

      await controller.handleWebhook(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Event ignored (not a pull_request)',
      })
    })

    it('retorna 200 e ignora actions que não são opened ou synchronize', async () => {
      const { req, res } = buildMocks()
      req.headers['x-github-delivery'] = 'delivery-123'
      req.headers['x-github-event'] = 'pull_request'
      req.body = { action: 'closed' } // Validated by middleware, we assume it's in req.body

      await controller.handleWebhook(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Action closed ignored',
      })
    })

    it('dispara o processamento em background e retorna 202 para eventos válidos', async () => {
      const { req, res } = buildMocks()
      req.headers['x-github-delivery'] = 'delivery-123'
      req.headers['x-github-event'] = 'pull_request'
      req.body = {
        action: 'opened',
        repository: { name: 'repo', owner: { login: 'owner' } },
        pull_request: { number: 1 },
        sender: { login: 'sender' },
      }

      vi.mocked(
        PullRequestService.prototype.processPullRequestWebhook,
      ).mockResolvedValue(undefined)

      await controller.handleWebhook(req, res)

      expect(res.status).toHaveBeenCalledWith(202)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Webhook accepted for processing',
      })
      expect(
        PullRequestService.prototype.processPullRequestWebhook,
      ).toHaveBeenCalledWith('delivery-123', 'owner', 'repo', 1, 'sender')
    })
  })
})
