import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./src/lib/db/index";
import { pageViews, linkClicks } from "./src/lib/db/schema";

async function check() {
  const pv = await db.select().from(pageViews);
  const lc = await db.select().from(linkClicks);
  console.log("📊 Page Views:", pv.length);
  pv.forEach((v) =>
    console.log("  -", v.timestamp, "|", v.device, "|", v.browser, "|", v.country)
  );
  console.log("🔗 Link Clicks:", lc.length);
  lc.forEach((c) =>
    console.log("  -", c.timestamp, "|", c.linkId)
  );
  process.exit(0);
}
check();
