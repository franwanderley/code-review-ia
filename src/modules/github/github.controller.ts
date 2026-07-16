import { Request, Response } from 'express'

import { PullRequestService } from '../pull-request/pull-request.service'
import { GithubWebhookPayloadSchema } from './github.validation'
import { z } from 'zod'

export class GithubController {
  private pullRequestService = new PullRequestService()

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const deliveryId = req.headers['x-github-delivery'] as string
    const event = req.headers['x-github-event'] as string

    if (!deliveryId) {
      res.status(400).json({ message: 'Missing x-github-delivery header' })
      return
    }

    if (event !== 'pull_request') {
      res.status(200).json({ message: 'Event ignored (not a pull_request)' })
      return
    }

    const payload = req.body as z.infer<typeof GithubWebhookPayloadSchema>

    if (payload.action !== 'opened' && payload.action !== 'synchronize') {
      res.status(200).json({ message: `Action ${payload.action} ignored` })
      return
    }

    this.pullRequestService
      .processPullRequestWebhook(
        deliveryId,
        payload.repository.owner.login,
        payload.repository.name,
        payload.pull_request.number,
        payload.sender.login,
      )
      .catch(error => {
        console.error(
          '[GithubController] Unhandled error in background processing:',
          error,
        )
      })

    res.status(202).json({ message: 'Webhook accepted for processing' })
  }
}
