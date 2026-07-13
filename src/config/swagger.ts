import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import { OpenAPIObjectConfigV31 } from '@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator'

import { registry } from '../shared/validation/registry'

export function generateSwaggerDocument(): ReturnType<
  OpenApiGeneratorV31['generateDocument']
> {
  const generator = new OpenApiGeneratorV31(registry.definitions)

  const config: OpenAPIObjectConfigV31 = {
    openapi: '3.1.0',
    info: {
      title: 'Code Review IA API',
      version: '1.0.0',
      description:
        'API de revisão de código automatizada via IA utilizando o Nara Router.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local development server',
      },
    ],
  }

  return generator.generateDocument(config)
}
