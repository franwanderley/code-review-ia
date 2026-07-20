import { AIClient } from '../../integrations/ai.client'
import { GithubClient } from '../../integrations/github.client'
import { AppError } from '../../shared/errors/AppError'
import { ProcessedEventService } from '../processed-event/processed-event.service'
import { UserService } from '../user/user.service'
import { PullRequestReviewModel } from './pull-request.model'

export class PullRequestService {
  private processedEventService = new ProcessedEventService()
  private userService = new UserService()
  private githubClient = new GithubClient()
  private aiClient = new AIClient()
  async processPullRequestWebhook(
    githubDeliveryId: string,
    repoOwner: string,
    repoName: string,
    pullRequestNumber: number,
    senderLogin: string,
  ): Promise<void> {
    console.log(
      `[PR Service] Starting webhook processing for delivery: ${githubDeliveryId}`,
    )

    const isProcessed =
      await this.processedEventService.isEventProcessed(githubDeliveryId)
    if (isProcessed) {
      console.log(
        `[PR Service] Delivery ${githubDeliveryId} already processed. Skipping.`,
      )
      return
    }

    console.log(`[PR Service] Upserting user: ${senderLogin}`)
    const user = await this.userService.upsertUserByGithubId(
      senderLogin,
      `${senderLogin}@users.noreply.github.com`,
    )

    console.log(
      `[PR Service] Creating PullRequestReview record for PR #${pullRequestNumber}`,
    )
    const review = await PullRequestReviewModel.create({
      userId: user._id,
      githubDeliveryId,
      repoOwner,
      repoName,
      pullRequestNumber,
      status: 'PENDENTE',
    })

    try {
      console.log(
        `[PR Service] Updating review status to PROCESSANDO for PR #${pullRequestNumber}`,
      )
      review.status = 'PROCESSANDO'
      await review.save()

      console.log(
        `[PR Service] Fetching pull request diff from GitHub for PR #${pullRequestNumber}`,
      )
      const diff = await this.githubClient.getPullRequestDiff(
        repoOwner,
        repoName,
        pullRequestNumber,
      )

      if (!diff || diff.trim() === '') {
        console.log(
          `[PR Service] Empty diff for PR #${pullRequestNumber}. Finalizing.`,
        )
        review.status = 'FINALIZADO'
        review.summary = 'No code changes detected in this pull request.'
        await review.save()
        return
      }

      console.log(
        `[PR Service] Sending diff (${diff.length} chars) to AI for analysis...`,
      )
      const suggestions = await this.aiClient.analyzePullRequest(diff)

      console.log(
        `[PR Service] Saving AI suggestions and finalizing PR #${pullRequestNumber}`,
      )
      review.status = 'FINALIZADO'
      review.suggestions = suggestions
      review.summary = `Analyzed successfully. Found ${suggestions.length} suggestion(s).`
      await review.save()

      console.log(
        `[PR Service] Successfully processed PR #${pullRequestNumber} for ${repoOwner}/${repoName}`,
      )
    } catch (error: unknown) {
      console.error(
        `[PR Service] Failed to process PR #${pullRequestNumber}:`,
        error,
      )

      review.status = 'FALHOU'
      review.errorMessage =
        error instanceof AppError ? error.message : 'Unknown internal error'
      await review.save()
    }
  }
}
