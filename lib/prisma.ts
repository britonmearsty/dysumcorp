import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

let prisma: PrismaClient;

if (connectionString) {
  const pool = new pg.Pool({
    connectionString,
    max: 1, // Limit connections in serverless
    idleTimeoutMillis: 10000, // Shorter idle timeout
    connectionTimeoutMillis: 5000, // Shorter connection timeout
    allowExitOnIdle: true, // Allow pool to close when idle
  });

  pool.on("error", (err) => {
    console.error("Unexpected pg pool error:", err);
  });

  const adapter = new PrismaPg(pool);

  if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient({ 
      adapter,
      log: process.env.DEBUG_DB ? ['query', 'error', 'warn'] : ['error'],
    });
  } else {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({ 
        adapter,
        log: ['query', 'error', 'warn'],
      });
    }
    prisma = globalForPrisma.prisma;
  }
} else {
  throw new Error("DATABASE_URL environment variable is not set");
}

export { prisma };
