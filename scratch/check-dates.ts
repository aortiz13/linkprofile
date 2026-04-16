import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/lib/db/index";
import { pageViews } from "../src/lib/db/schema";

async function check() {
  const pv = await db.select().from(pageViews);
  pv.forEach(v => console.log(v.timestamp, v.country, v.countryName));
  process.exit(0);
}
check();
