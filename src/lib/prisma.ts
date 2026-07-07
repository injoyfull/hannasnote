import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { SCHEMA_SQL } from "@/lib/schema-sql";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrisma> | undefined;
  schemaReady: Promise<void> | undefined;
};

// Resolve the database location:
// - explicit DATABASE_URL wins (a local `file:` path in dev, or a networked
//   `libsql://` Turso URL + token for real persistence);
// - otherwise, in production (Vercel serverless) fall back to an ephemeral
//   file under /tmp — the only writable path there. Data is NOT durable across
//   cold starts, which is fine for a preview deploy without a real database.
const url =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === "production"
    ? "file:/tmp/hannasnote.db"
    : "file:./data/notes.db");
const authToken = process.env.TURSO_AUTH_TOKEN;
const config = { url, ...(authToken ? { authToken } : {}) };

// Ensure the schema exists before any query runs. On a networked/durable DB the
// tables already exist and this is a cheap no-op (all statements are IF NOT
// EXISTS / INSERT OR IGNORE); on an empty ephemeral DB it creates everything.
function ensureSchema(): Promise<void> {
  if (globalForPrisma.schemaReady) return globalForPrisma.schemaReady;
  globalForPrisma.schemaReady = (async () => {
    const client = createClient(config);
    try {
      await client.executeMultiple(SCHEMA_SQL);
    } finally {
      client.close();
    }
  })();
  return globalForPrisma.schemaReady;
}

function createPrisma() {
  const adapter = new PrismaLibSql(config, { timestampFormat: "iso8601" });
  return new PrismaClient({ adapter }).$extends({
    query: {
      async $allOperations({ args, query }) {
        await ensureSchema();
        return query(args);
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
