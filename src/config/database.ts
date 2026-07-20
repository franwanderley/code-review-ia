import mongoose from 'mongoose'

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is not defined')
  }

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully')
  })

  mongoose.connection.on('error', error => {
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
