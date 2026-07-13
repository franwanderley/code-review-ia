import { Octokit } from '@octokit/rest'

import { AppError } from '../shared/errors/AppError'

export class GithubClient {
  private _octokit?: Octokit

  private get octokit(): Octokit {
    if (this._octokit) return this._octokit

    const pat = process.env.GITHUB_PAT

    if (!pat) {
      throw new AppError('GITHUB_PAT environment variable is not defined', 500)
    }

    this._octokit = new Octokit({
      auth: pat,
    })

    return this._octokit
  }

  async getPullRequestDiff(
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<string> {
    try {
      const response = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: {
          format: 'diff',
        },
      })

      return response.data as unknown as string
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new AppError(`Failed to fetch PR diff: ${errorMessage}`, 502)
    }
  }
}
