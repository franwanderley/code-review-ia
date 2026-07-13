import { apiReference } from '@scalar/express-api-reference'
import express from 'express'

import { generateSwaggerDocument } from './config/swagger'
import { healthRouter } from './routes/health.routes'

const app = express()

app.use(express.json())

app.use(healthRouter)

app.get('/api-docs/openapi.json', (_req, res) => {
  res.json(generateSwaggerDocument())
})

app.use(
  '/api-docs',
  apiReference({
    url: '/api-docs/openapi.json',
  }),
)

export { app }
