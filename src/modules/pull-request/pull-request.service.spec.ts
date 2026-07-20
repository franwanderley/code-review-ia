/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIClient } from '../../integrations/ai.client'
import { GithubClient } from '../../integrations/github.client'
import { ProcessedEventService } from '../processed-event/processed-event.service'
import { UserService } from '../user/user.service'
import { PullRequestReviewModel } from './pull-request.model'
import { PullRequestService } from './pull-request.service'
import { AppError } from '../../shared/errors/AppError'

vi.mock('../../integrations/ai.client')
vi.mock('../../integrations/github.client')
vi.mock('../processed-event/processed-event.service')
vi.mock('../user/user.service')
vi.mock('./pull-request.model')

describe('PullRequestService', () => {
  let service: PullRequestService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new PullRequestService()

    // Mock default successful flow
    vi.mocked(
      ProcessedEventService.prototype.isEventProcessed,
    ).mockResolvedValue(false)
    vi.mocked(UserService.prototype.upsertUserByGithubId).mockResolvedValue({
      _id: 'user-1',
    } as any)
    vi.mocked(GithubClient.prototype.getPullRequestDiff).mockResolvedValue(
      'diff content',
    )
    vi.mocked(AIClient.prototype.analyzePullRequest).mockResolvedValue([])
  })

  describe('processPullRequestWebhook', () => {
    it('ignora o processamento se o evento já foi processado', async () => {
      vi.mocked(
        ProcessedEventService.prototype.isEventProcessed,
      ).mockResolvedValueOnce(true)

      await service.processPullRequestWebhook(
        'delivery-1',
        'owner',
        'repo',
        1,
        'sender',
      )

      expect(UserService.prototype.upsertUserByGithubId).not.toHaveBeenCalled()
      expect(PullRequestReviewModel.create).not.toHaveBeenCalled()
    })

    it('salva como FINALIZADO se o diff for vazio e não chama a IA', async () => {
      vi.mocked(
        GithubClient.prototype.getPullRequestDiff,
      ).mockResolvedValueOnce('')
      const mockReview = { save: vi.fn() }
      vi.mocked(PullRequestReviewModel.create).mockResolvedValueOnce(
        mockReview as any,
      )

      await service.processPullRequestWebhook(
        'delivery-1',
        'owner',
        'repo',
        1,
        'sender',
      )

      expect(AIClient.prototype.analyzePullRequest).not.toHaveBeenCalled()
      expect(mockReview.status).toBe('FINALIZADO')
      expect(mockReview.summary).toBe(
        'No code changes detected in this pull request.',
      )
      expect(mockReview.save).toHaveBeenCalledTimes(2) // Once for PROCESSANDO, once for FINALIZADO
    })

    it('processa o fluxo completo com sucesso (PENDENTE -> PROCESSANDO -> FINALIZADO)', async () => {
      const mockSuggestions = [
        { file: 'a', line: 1, severity: 'info', message: 'm', suggestion: 's' },
      ]
      vi.mocked(AIClient.prototype.analyzePullRequest).mockResolvedValueOnce(
        mockSuggestions as any,
      )
      const mockReview = { save: vi.fn() }
      vi.mocked(PullRequestReviewModel.create).mockResolvedValueOnce(
        mockReview as any,
      )

      await service.processPullRequestWebhook(
        'delivery-1',
        'owner',
        'repo',
        1,
        'sender',
      )

      expect(PullRequestReviewModel.create).toHaveBeenCalledWith({
        userId: 'user-1',
        githubDeliveryId: 'delivery-1',
        repoOwner: 'owner',
        repoName: 'repo',
        pullRequestNumber: 1,
        status: 'PENDENTE',
      })
      expect(mockReview.status).toBe('FINALIZADO')
      expect(mockReview.suggestions).toBe(mockSuggestions)
      expect(mockReview.summary).toBe(
        'Analyzed successfully. Found 1 suggestion(s).',
      )
    })

    it('salva o status como FALHOU se a busca do diff lançar erro', async () => {
      vi.mocked(
        GithubClient.prototype.getPullRequestDiff,
      ).mockRejectedValueOnce(new AppError('API fail'))
      const mockReview = { save: vi.fn() }
      vi.mocked(PullRequestReviewModel.create).mockResolvedValueOnce(
        mockReview as any,
      )

      await service.processPullRequestWebhook(
        'delivery-1',
        'owner',
        'repo',
        1,
        'sender',
      )

      expect(mockReview.status).toBe('FALHOU')
      expect(mockReview.errorMessage).toBe('API fail')
    })

    it('salva o status como FALHOU para erros genéricos desconhecidos', async () => {
      vi.mocked(
        GithubClient.prototype.getPullRequestDiff,
      ).mockRejectedValueOnce(new Error('Generic failure'))
      const mockReview = { save: vi.fn() }
      vi.mocked(PullRequestReviewModel.create).mockResolvedValueOnce(
        mockReview as any,
      )

      await service.processPullRequestWebhook(
        'delivery-1',
        'owner',
        'repo',
        1,
        'sender',
      )

      expect(mockReview.status).toBe('FALHOU')
      expect(mockReview.errorMessage).toBe('Unknown internal error')
    })
  })
})
