import { describe, expect, it } from 'vitest'

import { UserModel } from './user.model'

describe('UserModel', () => {
  describe('valores padrão', () => {
    it('define plano padrão como free quando não informado', () => {
      const user = new UserModel({
        email: 'test@example.com',
        githubId: 'gh-001',
        quotaResetDate: new Date(),
      })

      expect(user.plan).toBe('free')
    })

    it('define quota padrão como 5 quando não informada', () => {
      const user = new UserModel({
        email: 'test@example.com',
        githubId: 'gh-001',
        quotaResetDate: new Date(),
      })

      expect(user.quota).toBe(5)
    })

    it('define usedQuota padrão como 0 quando não informado', () => {
      const user = new UserModel({
        email: 'test@example.com',
        githubId: 'gh-001',
        quotaResetDate: new Date(),
      })

      expect(user.usedQuota).toBe(0)
    })

    it('define quotaResetDate para aproximadamente um mês no futuro quando não informada', () => {
      const user = new UserModel({
        email: 'test@example.com',
        githubId: 'gh-001',
      })

      const oneMonthFromNow = new Date()
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

      expect(user.quotaResetDate.getMonth()).toBe(oneMonthFromNow.getMonth())
    })
  })

  describe('validação de campos obrigatórios', () => {
    it('lança erro de validação quando email não é informado', async () => {
      const user = new UserModel({
        githubId: 'gh-001',
        quotaResetDate: new Date(),
      })

      await expect(user.validate()).rejects.toMatchObject({
        errors: expect.objectContaining({ email: expect.anything() }),
      })
    })

    it('lança erro de validação quando githubId não é informado', async () => {
      const user = new UserModel({
        email: 'test@example.com',
        quotaResetDate: new Date(),
      })

      await expect(user.validate()).rejects.toMatchObject({
        errors: expect.objectContaining({ githubId: expect.anything() }),
      })
    })

    it('não lança erro de validação com todos os campos obrigatórios preenchidos', async () => {
      const user = new UserModel({
        email: 'test@example.com',
        githubId: 'gh-001',
        quotaResetDate: new Date(),
      })

      await expect(user.validate()).resolves.toBeUndefined()
    })
  })

  describe('validação de enum', () => {
    it('lança erro de validação quando plan recebe valor inválido', async () => {
      const user = new UserModel({
        email: 'test@example.com',
        githubId: 'gh-001',
        plan: 'enterprise',
        quotaResetDate: new Date(),
      })

      await expect(user.validate()).rejects.toMatchObject({
        errors: expect.objectContaining({ plan: expect.anything() }),
      })
    })

    it('lança erro de validação quando subscriptionStatus recebe valor inválido', async () => {
      const user = new UserModel({
        email: 'test@example.com',
        githubId: 'gh-001',
        subscriptionStatus: 'invalid-status',
        quotaResetDate: new Date(),
      })

      await expect(user.validate()).rejects.toMatchObject({
        errors: expect.objectContaining({
          subscriptionStatus: expect.anything(),
        }),
      })
    })

    it('aceita todos os valores válidos de subscriptionStatus', async () => {
      const validStatuses = [
        'active',
        'incomplete',
        'incomplete_expired',
        'past_due',
        'canceled',
        'unpaid',
        'trialing',
      ]

      for (const status of validStatuses) {
        const user = new UserModel({
          email: 'test@example.com',
          githubId: 'gh-001',
          subscriptionStatus: status,
          quotaResetDate: new Date(),
        })

        await expect(user.validate()).resolves.toBeUndefined()
      }
    })
  })
})
