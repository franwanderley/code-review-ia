import { expect, test } from 'vitest'

import { app } from './app'

test('health check test', () => {
  expect(app).toBeDefined()
})
