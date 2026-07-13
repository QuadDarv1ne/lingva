import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

  client.$queryRawUnsafe('PRAGMA journal_mode=WAL').catch((err) => { console.error('Failed to set WAL mode:', err) })
  client.$queryRawUnsafe('PRAGMA foreign_keys=ON').catch((err) => { console.error('Failed to set foreign keys:', err) })

  return client
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
