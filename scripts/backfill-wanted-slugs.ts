import { PrismaClient } from '@prisma/client';
import { buildWantedListingSlug } from '../lib/slugs';

const prisma = new PrismaClient();
const shouldWrite = process.argv.includes('--write');

async function main() {
  const listings = await prisma.wantedListing.findMany({
    where: {
      slug: null,
    },
    select: {
      id: true,
      models: true,
      region: true,
      budgetMax: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`${shouldWrite ? 'Writing' : 'Dry run'}: ${listings.length} wanted listings without slug`);

  for (const listing of listings) {
    const slug = buildWantedListingSlug(listing);
    console.log(`${listing.id} -> ${slug}`);

    if (shouldWrite) {
      await prisma.wantedListing.update({
        where: {
          id: listing.id,
        },
        data: {
          slug,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
