import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

  // Defer PRAGMA execution to avoid build-time DB connection errors
  // SQLite PRAGMA statements are safe to run on every connection
  client.$connect()
    .then(() => Promise.all([
      client.$executeRawUnsafe('PRAGMA journal_mode=WAL').catch(() => {}),
      client.$executeRawUnsafe('PRAGMA foreign_keys=ON').catch(() => {}),
    ]))
    .catch(() => {})

  return client
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
