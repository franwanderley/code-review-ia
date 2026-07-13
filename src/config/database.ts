import mongoose from 'mongoose'

export async function connectDatabase(): Promise<void> {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://localhost:27017/code-review-ia'

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully')
  })

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error)
  })

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected')
  })

  await mongoose.connect(mongoUri)
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
}
