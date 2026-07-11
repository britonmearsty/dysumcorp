import { logger } from "./logger";
import { PrismaNeon } from "@prisma/adapter-neon";
import { encrypt, decrypt, isEncrypted } from "./crypto-utils";

import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

const connectionString = process.env.DATABASE_URL;

let prisma: any;

const extendPrisma = (client: any) => {
  return client.$extends({
    query: {
      account: {
        async create({ args, query }: any) {
          if (args.data.accessToken) {
            args.data.accessToken = encrypt(args.data.accessToken);
          }
          if (args.data.refreshToken) {
            args.data.refreshToken = encrypt(args.data.refreshToken);
          }
          return query(args);
        },
        async update({ args, query }: any) {
          if (args.data.accessToken) {
            args.data.accessToken = encrypt(args.data.accessToken);
          }
          if (args.data.refreshToken) {
            args.data.refreshToken = encrypt(args.data.refreshToken);
          }
          return query(args);
        },
        async upsert({ args, query }: any) {
          if (args.create.accessToken) {
            args.create.accessToken = encrypt(args.create.accessToken);
          }
          if (args.create.refreshToken) {
            args.create.refreshToken = encrypt(args.create.refreshToken);
          }
          if (args.update.accessToken) {
            args.update.accessToken = encrypt(args.update.accessToken);
          }
          if (args.update.refreshToken) {
            args.update.refreshToken = encrypt(args.update.refreshToken);
          }
          return query(args);
        },
        async updateMany({ args, query }: any) {
          if (args.data.accessToken) {
            args.data.accessToken = encrypt(args.data.accessToken);
          }
          if (args.data.refreshToken) {
            args.data.refreshToken = encrypt(args.data.refreshToken);
          }
          return query(args);
        },
      },
    },
    result: {
      account: {
        accessToken: {
          needs: { accessToken: true },
          compute(account: any) {
            if (!account.accessToken) return account.accessToken;
            return isEncrypted(account.accessToken)
              ? decrypt(account.accessToken)
              : account.accessToken;
          },
        },
        refreshToken: {
          needs: { refreshToken: true },
          compute(account: any) {
            if (!account.refreshToken) return account.refreshToken;
            return isEncrypted(account.refreshToken)
              ? decrypt(account.refreshToken)
              : account.refreshToken;
          },
        },
      },
    },
  });
};

if (connectionString) {
  const adapter = new PrismaNeon({ connectionString });

  if (process.env.NODE_ENV === "production") {
    const baseClient = new PrismaClient({
      adapter,
      log: process.env.DEBUG_DB ? ["query", "error", "warn"] : ["error"],
    });
    prisma = extendPrisma(baseClient);
  } else {
    if (!globalForPrisma.prisma) {
      const baseClient = new PrismaClient({
        adapter,
        log: ["query", "error", "warn"],
      });
      globalForPrisma.prisma = extendPrisma(baseClient);
    }
    prisma = globalForPrisma.prisma;
  }
} else {
  throw new Error("DATABASE_URL environment variable is not set");
}

export { prisma };
