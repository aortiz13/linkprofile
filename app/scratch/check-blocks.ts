import { db } from "../src/lib/db/index";
import { blocks, profiles } from "../src/lib/db/schema";
async function run() {
  const allBlocks = await db.select().from(blocks);
  console.log("Blocks count:", allBlocks.length);
  const allProfiles = await db.select().from(profiles);
  console.log("Profiles count:", allProfiles.length);
  process.exit(0);
}
run();
