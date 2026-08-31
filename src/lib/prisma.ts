import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your .env file.");
}

/**
 * Single pg.Pool shared across the serverless function's lifetime.
 * Neon's -pooler endpoint already runs PgBouncer, so we keep a small
 * local pool (max 3) to support parallel RSC queries within one request
 * without starving the Neon pool.
 */
const createPrismaClient = (): PrismaClient => {
  const pool = new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
