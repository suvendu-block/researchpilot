import "dotenv/config";
import { runAgent } from "./agents";

// simple entry point — no CLI arg parsing, just takes topic from argv
// useful if you want to call this programmatically or script it quickly

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
