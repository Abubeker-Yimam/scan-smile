import { PrismaClient } from "@prisma/client";

/** Waits between retries. Two entries, so at most three attempts. */
const RETRY_DELAYS_MS = [300, 900];

/**
 * How long an operation may spend retrying before it has to report failure.
 *
 * This one number separates the two ways the connection breaks, because they
 * fail at completely different speeds. Measured against this database:
 *
 *   DNS lookup comes back empty      230ms   ← transient, worth another go
 *   connection refused              2100ms   ← worth one more go
 *   packets dropped, times out     10000ms   ← the full connect budget, spent
 *
 * A lookup that fails in a quarter of a second is usually fine on the next
 * attempt and costs nothing to repeat. A timeout has already spent ten seconds
 * proving the far end is not answering, and repeating it only spends them
 * again. Anything slower than this budget is therefore reported, not retried.
 *
 * Without a bound the difference compounds: one page runs up to three queries,
 * and three retried timeouts is a guest watching a blank screen for well over a
 * minute before being told it did not work — worse than the error it replaced.
 */
const RETRY_BUDGET_MS = 3000;

/**
 * Did this query fail *before* reaching the database?
 *
 * Only those are safe to retry blind. A statement that reached Postgres and
 * failed there must not be sent twice — `scanCount: { increment: 1 }` would
 * count one scan as two. P1001 and a failure to initialise both mean the
 * connection never opened, so nothing ran and nothing can be duplicated.
 */
function isUnreachable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "PrismaClientInitializationError" ||
    (error as { code?: string }).code === "P1001"
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The connection to Postgres, with brief failures absorbed.
 *
 * The database is in a Supabase region a long way from the people using this,
 * over links that drop a packet now and then. Without this, one unlucky DNS
 * lookup during dinner is a guest scanning their card and getting an error page
 * instead of their message.
 */
function createClient() {
  return new PrismaClient({
    // PRISMA_LOG_QUERIES=1 prints every statement. Worth keeping around: it is
    // how you tell one query per page from three, which is not visible from the
    // outside and is the difference between a fast scan and a slow one.
    log: process.env.PRISMA_LOG_QUERIES === "1" ? ["query"] : [],
  }).$extends({
    query: {
      async $allOperations({ args, query }) {
        const started = Date.now();
        for (let attempt = 0; ; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            const delay: number | undefined = RETRY_DELAYS_MS[attempt];
            const spentAfterWaiting = Date.now() - started + (delay ?? 0);
            const worthIt =
              delay !== undefined && spentAfterWaiting < RETRY_BUDGET_MS && isUnreachable(error);
            if (!worthIt) throw error;
            await sleep(delay);
          }
        }
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
