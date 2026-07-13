import { Types } from 'mongoose'

export type ReviewStatus = 'PENDENTE' | 'PROCESSANDO' | 'FINALIZADO' | 'FALHOU'

export type SuggestionSeverity = 'info' | 'warning' | 'error'

export interface ReviewSuggestion {
  file: string
  line: number
  severity: SuggestionSeverity
  message: string
  suggestion: string
}

export interface PullRequestReview {
  userId: Types.ObjectId
  githubDeliveryId: string
  repoOwner: string
  repoName: string
  pullRequestNumber: number
  status: ReviewStatus
  summary?: string
  suggestions: ReviewSuggestion[]
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}
