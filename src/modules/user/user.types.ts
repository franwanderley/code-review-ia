export type UserPlan = 'free' | 'pro'

export type SubscriptionStatus =
  | 'active'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'trialing'

export interface EncryptedData {
  encryptedData: string
  iv: string
  authTag: string
}

export interface User {
  email: string
  githubId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  plan: UserPlan
  subscriptionStatus?: SubscriptionStatus
  quota: number
  usedQuota: number
  quotaResetDate: Date
  githubPat?: EncryptedData
  createdAt: Date
  updatedAt: Date
}
