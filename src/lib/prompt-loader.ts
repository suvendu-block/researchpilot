import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadPrompt(version?: string): string {
  const v = version || process.env.PROMPT_VERSION || "v1";
  const path = join(
    __dirname,
    "../../prompts/research-agent-" + v + ".txt"
  );
  return readFileSync(path, "utf-8");
}
