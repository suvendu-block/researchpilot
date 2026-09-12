import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ESM doesn't have __dirname, so we derive it from import.meta.url
const __dirname = dirname(fileURLToPath(import.meta.url));

// loads a prompt file from the prompts/ directory
// lets us version prompts without changing code — just add a new .txt file
// priority: explicit version arg > PROMPT_VERSION env var > "v1" default
export function loadPrompt(version?: string): string {
  const v = version || process.env.PROMPT_VERSION || "v1";
  const path = join(
    __dirname,
    "../../prompts/research-agent-" + v + ".txt"
  );
  return readFileSync(path, "utf-8");
}
