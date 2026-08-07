import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * Zeroes every scan counter.
 *
 * Run this after test-scanning the printed cards and before guests arrive, so
 * the numbers the host watches on the night start from nothing.
 *
 *   npm run db:reset-scans
 */
async function main() {
  const result = await db.guest.updateMany({
    data: { scanCount: 0, firstScannedAt: null, lastScannedAt: null },
  });
  console.log(`Reset scan counters on ${result.count} guests.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
