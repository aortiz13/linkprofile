import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './src/lib/db/index.ts';
import { linkClicks, pageViews } from './src/lib/db/schema.ts';
import { count, and, eq, gte, lte } from 'drizzle-orm';

async function run() {
  const profileId = '5ade0465-59d9-4daa-820e-0cdfe1a66584';
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = new Date();

  const [visitResult] = await db
    .select({ total: count() })
    .from(pageViews)
    .where(
      and(
        eq(pageViews.profileId, profileId),
        gte(pageViews.timestamp, from),
        lte(pageViews.timestamp, to)
      )
    );

  const [clickResult] = await db
    .select({ total: count() })
    .from(linkClicks)
    .where(
      and(
        eq(linkClicks.profileId, profileId),
        gte(linkClicks.timestamp, from),
        lte(linkClicks.timestamp, to)
      )
    );

  console.log('visits:', visitResult?.total);
  console.log('clicks:', clickResult?.total);
  process.exit(0);
}
run();
