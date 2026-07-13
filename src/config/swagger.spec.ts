import { describe, expect, it } from 'vitest'

import '../routes/health.routes'
import { generateSwaggerDocument } from './swagger'

describe('generateSwaggerDocument', () => {
  it('retorna um documento com a versão OpenAPI 3.1.0', () => {
    const document = generateSwaggerDocument()

    expect(document.openapi).toBe('3.1.0')
  })

  it('retorna informações corretas da API no campo info', () => {
    const document = generateSwaggerDocument()

    expect(document.info.title).toBe('Code Review IA API')
    expect(document.info.version).toBe('1.0.0')
  })

  it('retorna a rota /health registrada nos paths', () => {
    const document = generateSwaggerDocument()

    expect(document.paths).toHaveProperty('/health')
  })

  it('retorna o schema HealthResponse registrado nos components', () => {
    const document = generateSwaggerDocument()

    expect(document.components?.schemas).toHaveProperty('HealthResponse')
  })
})
