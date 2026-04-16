import './load-env';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY_FLAG = '--apply';

type ColumnRow = {
  column_name: string;
};

type UsageRow = {
  total: number;
  trade_true: number;
  kickback_not_null: number;
};

type SampleRow = {
  id: string;
  trade: boolean;
  kickback: boolean | null;
};

function hasApplyFlag(argv: string[]) {
  return argv.includes(APPLY_FLAG);
}

async function getLegacyColumns() {
  const rows = await prisma.$queryRawUnsafe<ColumnRow[]>(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'SaleListing'
      AND column_name IN ('trade', 'kickback')
    ORDER BY column_name;
  `);

  return new Set(rows.map((row) => row.column_name));
}

async function getLegacyUsage() {
  const rows = await prisma.$queryRawUnsafe<UsageRow[]>(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "trade" = true)::int AS trade_true,
      COUNT(*) FILTER (WHERE "kickback" IS NOT NULL)::int AS kickback_not_null
    FROM "SaleListing";
  `);

  return rows[0] ?? { total: 0, trade_true: 0, kickback_not_null: 0 };
}

async function getLegacySamples() {
  return prisma.$queryRawUnsafe<SampleRow[]>(`
    SELECT id, "trade", "kickback"
    FROM "SaleListing"
    WHERE "trade" = true OR "kickback" IS NOT NULL
    ORDER BY "updatedAt" DESC
    LIMIT 10;
  `);
}

async function main() {
  const apply = hasApplyFlag(process.argv.slice(2));
  const columns = await getLegacyColumns();

  if (columns.size === 0) {
    console.log('Legacy columns are already absent: SaleListing.trade, SaleListing.kickback');
    return;
  }

  const usage = await getLegacyUsage();
  const samples = await getLegacySamples();

  console.log('Legacy columns detected in "SaleListing":');
  console.log(`- trade: ${columns.has('trade') ? 'present' : 'absent'}`);
  console.log(`- kickback: ${columns.has('kickback') ? 'present' : 'absent'}`);
  console.log(`- rows in SaleListing: ${usage.total}`);
  console.log(`- rows where trade = true: ${usage.trade_true}`);
  console.log(`- rows where kickback IS NOT NULL: ${usage.kickback_not_null}`);

  if (samples.length > 0) {
    console.log('- sample rows that still carry legacy values:');
    for (const sample of samples) {
      console.log(
        `  • ${sample.id}: trade=${String(sample.trade)}, kickback=${String(sample.kickback)}`
      );
    }
  }

  if (!apply) {
    console.log('');
    console.log(`Dry run only. Re-run with "${APPLY_FLAG}" to drop the legacy columns.`);
    return;
  }

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "SaleListing"
    DROP COLUMN IF EXISTS "kickback",
    DROP COLUMN IF EXISTS "trade";
  `);

  const remainingColumns = await getLegacyColumns();
  if (remainingColumns.size > 0) {
    throw new Error(
      `Column drop verification failed. Remaining columns: ${Array.from(remainingColumns).join(', ')}`
    );
  }

  console.log('Legacy columns removed successfully from "SaleListing".');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
