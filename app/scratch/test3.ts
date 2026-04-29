import { db } from './src/lib/db/index.ts';
import { linkClicks } from './src/lib/db/schema.ts';
import { count } from 'drizzle-orm';

async function run() {
  const [clickResult] = await db.select({ total: count() }).from(linkClicks);
  console.log('Result:', clickResult);
  console.log('Type of total:', typeof clickResult.total);
  process.exit(0);
}
run();
