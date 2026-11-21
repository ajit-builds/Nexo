/**
 * Nexo — Prisma Client Singleton
 * Prevents multiple PrismaClient instances in Next.js hot-reload (dev mode).
 */
import { PrismaClient } from '@prisma/client';

// Safeguard default for build/serverless environments if DATABASE_URL is not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
