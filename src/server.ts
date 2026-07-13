import 'dotenv/config'

import { app } from './app'
import { connectDatabase } from './config/database'

const port = process.env.PORT || 3000

async function startServer() {
  try {
    await connectDatabase()
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
