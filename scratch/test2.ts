import { getSummary } from './src/lib/analytics-queries';

async function run() {
  const profileId = '5ade0465-59d9-4daa-820e-0cdfe1a66584';
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const result = await getSummary(profileId, thirtyDaysAgo, now);
  console.log(result);
  process.exit(0);
}
run();
