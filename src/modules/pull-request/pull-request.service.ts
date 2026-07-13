import { AIClient } from '../../integrations/ai.client'
import { GithubClient } from '../../integrations/github.client'
import { AppError } from '../../shared/errors/AppError'
import { ProcessedEventService } from '../processed-event/processed-event.service'
import { UserService } from '../user/user.service'
import { PullRequestReviewModel } from './pull-request.model'

export class PullRequestService {
  private processedEventService = new ProcessedEventService()
  private userService = new UserService()
  // Instantiate clients inside the service or inject them (for MVP we instantiate directly)
  private githubClient = new GithubClient()
  private aiClient = new AIClient()

  /**
   * Main entrypoint for processing a GitHub webhook payload for a Pull Request.
   */
  async processPullRequestWebhook(
    githubDeliveryId: string,
    repoOwner: string,
    repoName: string,
    pullRequestNumber: number,
    senderLogin: string,
  ): Promise<void> {
    // 1. Idempotency Check
    const isProcessed =
      await this.processedEventService.isEventProcessed(githubDeliveryId)
    if (isProcessed) {
      console.log(
        `[PR Service] Delivery ${githubDeliveryId} already processed. Skipping.`,
      )
      return
    }

    // 2. Upsert User (using repoOwner as fallback or senderLogin)
    // In a real scenario, we'd map this properly. Using senderLogin as githubId.
    const user = await this.userService.upsertUserByGithubId(
      senderLogin,
      `${senderLogin}@users.noreply.github.com`,
    )

    // 3. Create the Review Record (PENDENTE)
    const review = await PullRequestReviewModel.create({
      userId: user._id,
      githubDeliveryId,
      repoOwner,
      repoName,
      pullRequestNumber,
      status: 'PENDENTE',
    })

    try {
      // 4. Update status to PROCESSANDO
      review.status = 'PROCESSANDO'
      await review.save()

      // 5. Fetch Diff from GitHub
      const diff = await this.githubClient.getPullRequestDiff(
        repoOwner,
        repoName,
        pullRequestNumber,
      )

      if (!diff || diff.trim() === '') {
        review.status = 'FINALIZADO'
        review.summary = 'No code changes detected in this pull request.'
        await review.save()
        return
      }

      // 6. Send Diff to AI for Analysis
      // MVP: We send the entire diff. A more robust solution truncates it here.
      const suggestions = await this.aiClient.analyzePullRequest(diff)

      // 7. Save the suggestions and mark as FINALIZADO
      review.status = 'FINALIZADO'
      review.suggestions = suggestions
      review.summary = `Analyzed successfully. Found ${suggestions.length} suggestion(s).`
      await review.save()

      console.log(
        `[PR Service] Successfully processed PR #${pullRequestNumber} for ${repoOwner}/${repoName}`,
      )

      // Note: We DO NOT post comments back to GitHub per the MVP requirements.
    } catch (error: unknown) {
      console.error(
        `[PR Service] Failed to process PR #${pullRequestNumber}:`,
        error,
      )

      // Update status to FALHOU
      review.status = 'FALHOU'
      review.errorMessage =
        error instanceof AppError ? error.message : 'Unknown internal error'
      await review.save()
    }
  }
}
