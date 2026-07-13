import { Schema, model } from 'mongoose'

import { User } from './user.types'

const encryptedDataSchema = new Schema(
  {
    encryptedData: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { _id: false },
)

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    githubId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      index: true,
      sparse: true,
    },
    stripeSubscriptionId: {
      type: String,
      index: true,
      sparse: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
      required: true,
    },
    subscriptionStatus: {
      type: String,
      enum: [
        'active',
        'incomplete',
        'incomplete_expired',
        'past_due',
        'canceled',
        'unpaid',
        'trialing',
      ],
      index: true,
    },
    quota: {
      type: Number,
      required: true,
      default: 5,
    },
    usedQuota: {
      type: Number,
      required: true,
      default: 0,
    },
    quotaResetDate: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date()
        date.setMonth(date.getMonth() + 1)
        return date
      },
    },
    githubPat: {
      type: encryptedDataSchema,
    },
  },
  {
    timestamps: true,
  },
)

export const UserModel = model<User>('User', userSchema)
