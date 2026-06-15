import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const RETENTION_DAYS = Number(process.env.CHECK_RETENTION_DAYS || 30);

async function main() {
  const cutoffDate = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  console.log(`[CLEANUP] Delete checks older than ${RETENTION_DAYS} days`);
  console.log(`[CLEANUP] Cutoff: ${cutoffDate.toISOString()}`);

  const result = await prisma.check.deleteMany({
    where: {
      checkedAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`[CLEANUP] Deleted ${result.count} old check(s)`);
}

main()
  .catch((error) => {
    console.error("[CLEANUP] Failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });