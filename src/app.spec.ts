import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { app } from './app'

describe('GET /health', () => {
  it('retorna status 200', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
  })

  it('retorna body com status ok', async () => {
    const response = await request(app).get('/health')

    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('GET /api-docs/openapi.json', () => {
  it('retorna status 200', async () => {
    const response = await request(app).get('/api-docs/openapi.json')

    expect(response.status).toBe(200)
  })

  it('retorna um documento OpenAPI válido com a versão 3.1.0', async () => {
    const response = await request(app).get('/api-docs/openapi.json')

    expect(response.body.openapi).toBe('3.1.0')
  })
})
