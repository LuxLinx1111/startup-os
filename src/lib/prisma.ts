import { PrismaClient } from "@prisma/client";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// OAuth access/refresh tokens (from linking Google Calendar, etc.) land in the
// `accounts` table via NextAuth's Prisma adapter. That table is NOT encrypted by
// NextAuth itself. This middleware transparently encrypts those specific fields
// before they hit the database, and decrypts them again on the way out, reusing
// the same AES-256-GCM helper already built for the Password/API Vault feature —
// so nothing that reads `prisma.account...` (including NextAuth's own adapter
// code, and our Google Calendar sync code) needs to know encryption is happening.
const TOKEN_FIELDS = ["access_token", "refresh_token", "id_token"] as const;

function encryptTokenFields(data: Record<string, unknown> | undefined) {
  if (!data) return;
  for (const field of TOKEN_FIELDS) {
    const value = data[field];
    if (typeof value === "string" && value.length > 0) {
      data[field] = encryptSecret(value);
    }
  }
}

function decryptTokenFields(row: Record<string, unknown> | null | undefined) {
  if (!row) return;
  for (const field of TOKEN_FIELDS) {
    const value = row[field];
    if (typeof value === "string" && value.length > 0) {
      try {
        row[field] = decryptSecret(value);
      } catch {
        // Leave the raw value alone if it isn't in our encrypted format (e.g. a
        // row written before this middleware existed) rather than throwing.
      }
    }
  }
}

prismaClient.$use(async (params, next) => {
  if (params.model !== "Account") {
    return next(params);
  }

  if (params.action === "create" || params.action === "update") {
    encryptTokenFields(params.args?.data);
  } else if (params.action === "upsert") {
    encryptTokenFields(params.args?.create);
    encryptTokenFields(params.args?.update);
  }

  const result = await next(params);

  if (Array.isArray(result)) {
    result.forEach((row) => decryptTokenFields(row));
  } else {
    decryptTokenFields(result);
  }

  return result;
});

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
