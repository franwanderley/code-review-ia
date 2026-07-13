import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { connectDatabase, disconnectDatabase } from './database'

const { mockConnect, mockDisconnect, mockConnectionOn } = vi.hoisted(() => ({
  mockConnect: vi.fn().mockResolvedValue(undefined),
  mockDisconnect: vi.fn().mockResolvedValue(undefined),
  mockConnectionOn: vi.fn(),
}))

vi.mock('mongoose', () => ({
  default: {
    connect: mockConnect,
    disconnect: mockDisconnect,
    connection: {
      on: mockConnectionOn,
    },
  },
}))

describe('connectDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.MONGO_URI
  })

  it('lança erro quando MONGO_URI não está definida', async () => {
    delete process.env.MONGO_URI

    await expect(connectDatabase()).rejects.toThrow(
      'MONGO_URI environment variable is not defined',
    )
  })

  it('conecta ao banco quando MONGO_URI está definida', async () => {
    process.env.MONGO_URI = 'mongodb://localhost:27017/test'

    await connectDatabase()

    expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost:27017/test')
    expect(mockConnect).toHaveBeenCalledTimes(1)
  })

  it('registra os listeners de eventos de conexão', async () => {
    process.env.MONGO_URI = 'mongodb://localhost:27017/test'

    await connectDatabase()

    expect(mockConnectionOn).toHaveBeenCalledWith(
      'connected',
      expect.any(Function),
    )
    expect(mockConnectionOn).toHaveBeenCalledWith('error', expect.any(Function))
    expect(mockConnectionOn).toHaveBeenCalledWith(
      'disconnected',
      expect.any(Function),
    )
  })
})

describe('disconnectDatabase', () => {
  it('desconecta do banco com sucesso', async () => {
    await disconnectDatabase()

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })
})
