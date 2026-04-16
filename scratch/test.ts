import * as dotenv from 'dotenv';
import * as fs from 'fs';
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}
import { db } from './src/lib/db/index.ts';
import { linkClicks } from './src/lib/db/schema.ts';

async function run() {
  const clicks = await db.select().from(linkClicks);
  console.log('Total clicks in DB:', clicks.length);
  if (clicks.length > 0) {
    console.log(clicks.slice(-3));
  }
  process.exit(0);
}
run();
