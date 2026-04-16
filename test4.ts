import { db } from './src/lib/db/index.ts';
import { pageViews } from './src/lib/db/schema.ts';
import { desc } from 'drizzle-orm';

async function run() {
  const views = await db.select().from(pageViews).orderBy(desc(pageViews.timestamp)).limit(3);
  console.log('Recent pageViews:', views);
  process.exit(0);
}
run();
