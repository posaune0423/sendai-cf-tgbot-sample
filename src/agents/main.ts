import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { gpt4oMini } from "../utils/model";
import { mainPrompt } from "../prompts/main";
import { solanaTools } from "../tools/solana";

export async function initializeAgent(userId: string, env: Env) {
    try {
        const memory = new MemorySaver();
        const config = { configurable: { thread_id: userId } };

        const tools = await solanaTools(env);

        const agent = createReactAgent({
            llm: gpt4oMini(env.OPENAI_API_KEY),
            tools,
            checkpointSaver: memory,
            messageModifier: mainPrompt,
        });

        return { agent, config };
    } catch (error) {
        console.error("Failed to initialize agent:", error);
        throw error;
    }
}
