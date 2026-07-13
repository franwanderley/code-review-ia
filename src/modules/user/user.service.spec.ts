/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserModel } from './user.model'
import { UserService } from './user.service'

describe('UserService', () => {
  let service: UserService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new UserService()
  })

  describe('upsertUserByGithubId', () => {
    it('retorna o usuário existente caso já exista', async () => {
      const mockUser = {
        _id: '123',
        githubId: 'test-user',
        email: 'test@mail.com',
      }
      vi.spyOn(UserModel, 'findOne').mockResolvedValueOnce(mockUser as any)
      const createSpy = vi.spyOn(UserModel, 'create')

      const result = await service.upsertUserByGithubId(
        'test-user',
        'test@mail.com',
      )

      expect(result).toEqual(mockUser)
      expect(UserModel.findOne).toHaveBeenCalledWith({ githubId: 'test-user' })
      expect(createSpy).not.toHaveBeenCalled()
    })

    it('cria um novo usuário caso não exista', async () => {
      vi.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null)
      const mockNewUser = {
        _id: '456',
        githubId: 'new-user',
        email: 'new@mail.com',
        plan: 'free',
      }
      vi.spyOn(UserModel, 'create').mockResolvedValueOnce(mockNewUser as any)

      const result = await service.upsertUserByGithubId(
        'new-user',
        'new@mail.com',
      )

      expect(result).toEqual(mockNewUser)
      expect(UserModel.create).toHaveBeenCalledWith({
        githubId: 'new-user',
        email: 'new@mail.com',
        plan: 'free',
        quota: 5,
        usedQuota: 0,
      })
    })
  })
})
