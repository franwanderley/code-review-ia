import { describe, expect, it } from 'vitest'

import { PullRequestReviewModel } from './pull-request.model'

describe('PullRequestReviewModel', () => {
  describe('valores padrão', () => {
    it('define status padrão como PENDENTE quando não informado', () => {
      const review = new PullRequestReviewModel({
        userId: '507f1f77bcf86cd799439011',
        githubDeliveryId: 'delivery-001',
        repoOwner: 'franwanderley',
        repoName: 'code-review-ia',
        pullRequestNumber: 1,
      })

      expect(review.status).toBe('PENDENTE')
    })

    it('define suggestions padrão como array vazio quando não informado', () => {
      const review = new PullRequestReviewModel({
        userId: '507f1f77bcf86cd799439011',
        githubDeliveryId: 'delivery-001',
        repoOwner: 'franwanderley',
        repoName: 'code-review-ia',
        pullRequestNumber: 1,
      })

      expect(review.suggestions).toEqual([])
    })
  })

  describe('validação de campos obrigatórios', () => {
    it('lança erro de validação quando userId não é informado', async () => {
      const review = new PullRequestReviewModel({
        githubDeliveryId: 'delivery-001',
        repoOwner: 'franwanderley',
        repoName: 'code-review-ia',
        pullRequestNumber: 1,
      })

      await expect(review.validate()).rejects.toMatchObject({
        errors: expect.objectContaining({ userId: expect.anything() }),
      })
    })

    it('lança erro de validação quando githubDeliveryId não é informado', async () => {
      const review = new PullRequestReviewModel({
        userId: '507f1f77bcf86cd799439011',
        repoOwner: 'franwanderley',
        repoName: 'code-review-ia',
        pullRequestNumber: 1,
      })

      await expect(review.validate()).rejects.toMatchObject({
        errors: expect.objectContaining({
          githubDeliveryId: expect.anything(),
        }),
      })
    })

    it('lança erro de validação quando repoOwner não é informado', async () => {
      const review = new PullRequestReviewModel({
        userId: '507f1f77bcf86cd799439011',
        githubDeliveryId: 'delivery-001',
        repoName: 'code-review-ia',
        pullRequestNumber: 1,
      })

      await expect(review.validate()).rejects.toMatchObject({
        errors: expect.objectContaining({ repoOwner: expect.anything() }),
      })
    })

    it('não lança erro de validação com todos os campos obrigatórios preenchidos', async () => {
      const review = new PullRequestReviewModel({
        userId: '507f1f77bcf86cd799439011',
        githubDeliveryId: 'delivery-001',
        repoOwner: 'franwanderley',
        repoName: 'code-review-ia',
        pullRequestNumber: 1,
      })

      await expect(review.validate()).resolves.toBeUndefined()
    })
  })

  describe('validação de enum de status', () => {
    it('lança erro de validação quando status recebe valor inválido', async () => {
      const review = new PullRequestReviewModel({
        userId: '507f1f77bcf86cd799439011',
        githubDeliveryId: 'delivery-001',
        repoOwner: 'franwanderley',
        repoName: 'code-review-ia',
        pullRequestNumber: 1,
        status: 'INVALIDO',
      })

      await expect(review.validate()).rejects.toMatchObject({
        errors: expect.objectContaining({ status: expect.anything() }),
      })
    })

    it('aceita todos os status válidos do fluxo de análise', async () => {
      const validStatuses = ['PENDENTE', 'PROCESSANDO', 'FINALIZADO', 'FALHOU']

      for (const status of validStatuses) {
        const review = new PullRequestReviewModel({
          userId: '507f1f77bcf86cd799439011',
          githubDeliveryId: 'delivery-001',
          repoOwner: 'franwanderley',
          repoName: 'code-review-ia',
          pullRequestNumber: 1,
          status,
        })

        await expect(review.validate()).resolves.toBeUndefined()
      }
    })
  })
})
