import { User } from './user.types'
import { UserModel } from './user.model'

export class UserService {
  /**
   * Encontra um usuário pelo githubId ou cria um novo com plano gratuito.
   */
  async upsertUserByGithubId(
    githubId: string,
    email: string,
  ): Promise<User & { _id: unknown }> {
    const existingUser = await UserModel.findOne({ githubId })

    if (existingUser) {
      return existingUser
    }

    const newUser = await UserModel.create({
      githubId,
      email,
      plan: 'free',
      quota: 5,
      usedQuota: 0,
    })

    return newUser
  }
}
