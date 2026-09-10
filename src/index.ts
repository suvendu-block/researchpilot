import "dotenv/config";
import { runAgent } from "./agents";

async function main() {
  const topic = process.argv[2] || "transformer attention mechanisms";

  console.log(`\nSearching for: ${topic}\n`);

  try {
    const text = await runAgent(topic);
    console.log(text);
  } catch (error) {
    console.error("\n[error] Agent failed:", (error as Error).message);
    process.exit(1);
  }
}

main();
