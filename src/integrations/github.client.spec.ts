/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from '@octokit/rest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppError } from '../shared/errors/AppError'
import { GithubClient } from './github.client'

vi.mock('@octokit/rest', () => {
  const pullsGet = vi.fn()
  return {
    Octokit: vi.fn().mockImplementation(function () {
      return {
        pulls: {
          get: pullsGet,
        },
      }
    }),
    pullsGetMock: pullsGet, // Exported for assertions
  }
})

describe('GithubClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.GITHUB_PAT
  })

  describe('initialization', () => {
    it('lança erro quando GITHUB_PAT não está definida ao tentar usar o client', async () => {
      delete process.env.GITHUB_PAT

      const client = new GithubClient()
      await expect(
        client.getPullRequestDiff('owner', 'repo', 1),
      ).rejects.toThrow(AppError)
      await expect(
        client.getPullRequestDiff('owner', 'repo', 1),
      ).rejects.toThrow('GITHUB_PAT environment variable is not defined')
    })

    it('inicializa o Octokit com o token GITHUB_PAT na primeira chamada', async () => {
      process.env.GITHUB_PAT = 'ghp_test'
      const { pullsGetMock } = (await import('@octokit/rest')) as any
      pullsGetMock.mockResolvedValueOnce({ data: 'mock' })

      const client = new GithubClient()
      await client.getPullRequestDiff('owner', 'repo', 1)

      expect(Octokit).toHaveBeenCalledWith({ auth: 'ghp_test' })
    })
  })

  describe('getPullRequestDiff', () => {
    it('retorna a string do diff corretamente', async () => {
      process.env.GITHUB_PAT = 'ghp_test'
      const client = new GithubClient()

      const { pullsGetMock } = (await import('@octokit/rest')) as any
      pullsGetMock.mockResolvedValueOnce({ data: 'mocked diff content' })

      const diff = await client.getPullRequestDiff('owner', 'repo', 1)

      expect(pullsGetMock).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 1,
        mediaType: { format: 'diff' },
      })
      expect(diff).toBe('mocked diff content')
    })

    it('lança AppError quando a API do GitHub falha', async () => {
      process.env.GITHUB_PAT = 'ghp_test'
      const client = new GithubClient()

      const { pullsGetMock } = (await import('@octokit/rest')) as any
      pullsGetMock.mockRejectedValue(new Error('GitHub API Error'))

      await expect(
        client.getPullRequestDiff('owner', 'repo', 1),
      ).rejects.toThrow(AppError)
      await expect(
        client.getPullRequestDiff('owner', 'repo', 1),
      ).rejects.toThrow('Failed to fetch PR diff: GitHub API Error')
    })
  })
})
