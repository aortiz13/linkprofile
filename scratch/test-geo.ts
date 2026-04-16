import { getGeo } from "../src/lib/geo";

async function main() {
  console.log("Localhost:", await getGeo("127.0.0.1"));
  console.log("Null:", await getGeo(null));
}

main().catch(console.error);
