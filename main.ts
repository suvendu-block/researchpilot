import { runAgent } from "./agent";






async function main() {
    const topic  = process.arg[2] || "trasformer attention mechaisms";
    console.log(`\nSearching for ${topic}\n`);

    const result = await runAgent(topic);



    for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
    }

    const usage = await result.usage;
    console.log("\n\n--Usage ---");
    console.log(`Input token: ${usage.promptTokens}`);
    console.log(`Output token: ${usage.completionTokens}`);
    console.log(`Total token: ${usage.totalTokens}`);
}


main().catch(console.error)


