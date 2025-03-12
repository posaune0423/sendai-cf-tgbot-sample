import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { gpt4oMini } from "../utils/model";
import { mainPrompt } from "../prompts/main";
import { solanaTools } from "../tools/solana";

export async function initAgent(userId: string) {
    try {
        const memory = new MemorySaver();
        const config = { configurable: { thread_id: userId } };

        const tools = solanaTools();

        const agent = createReactAgent({
            llm: gpt4oMini,
            tools,
            checkpointSaver: memory,
            prompt: mainPrompt,
        });

        return { agent, config };
    } catch (error) {
        console.error("Failed to initialize agent:", error);
        throw error;
    }
}
