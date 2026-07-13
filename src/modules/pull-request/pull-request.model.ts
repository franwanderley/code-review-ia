import { Schema, model } from 'mongoose'

import { PullRequestReview, ReviewSuggestion } from './pull-request.types'

const reviewSuggestionSchema = new Schema<ReviewSuggestion>(
  {
    file: { type: String, required: true },
    line: { type: Number, required: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error'],
      required: true,
    },
    message: { type: String, required: true },
    suggestion: { type: String, required: true },
  },
  { _id: false },
)

const pullRequestReviewSchema = new Schema<PullRequestReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    githubDeliveryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    repoOwner: {
      type: String,
      required: true,
    },
    repoName: {
      type: String,
      required: true,
    },
    pullRequestNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDENTE', 'PROCESSANDO', 'FINALIZADO', 'FALHOU'],
      default: 'PENDENTE',
      required: true,
    },
    summary: {
      type: String,
    },
    suggestions: {
      type: [reviewSuggestionSchema],
      default: [],
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

pullRequestReviewSchema.index({
  repoOwner: 1,
  repoName: 1,
  pullRequestNumber: 1,
})

export const PullRequestReviewModel = model<PullRequestReview>(
  'PullRequestReview',
  pullRequestReviewSchema,
)
