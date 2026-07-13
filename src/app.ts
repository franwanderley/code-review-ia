import { apiReference } from '@scalar/express-api-reference'
import express from 'express'

import { generateSwaggerDocument } from './config/swagger'
import { githubRouter } from './routes/github.routes'
import { healthRouter } from './routes/health.routes'

const app = express()

app.use(express.json())

app.use(healthRouter)
app.use(githubRouter)

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
