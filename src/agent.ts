import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";

export async function initializeAgent(userId: string, env: Env) {
    try {
        // dynamic import SolanaAgentKit inside the handler
        const { SolanaAgentKit, createSolanaTools } = await import("solana-agent-kit");

        const llm = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0.7,
            apiKey: env.OPENAI_API_KEY,
        });

        const solanaKit = new SolanaAgentKit(env.SOLANA_PRIVATE_KEY, env.RPC_URL, {
            OPENAI_API_KEY: env.OPENAI_API_KEY,
            PERPLEXITY_API_KEY: env.PERPLEXITY_API_KEY,
            ALLORA_API_KEY: env.ALLORA_API_KEY,
            ALLORA_API_URL: env.ALLORA_API_URL,
            HELIUS_API_KEY: env.HELIUS_API_KEY,
            JUPITER_REFERRAL_ACCOUNT: env.JUPITER_REFERRAL_ACCOUNT,
            FLASH_PRIVILEGE: env.FLASH_PRIVILEGE,
            ETHEREUM_PRIVATE_KEY: env.ETHEREUM_PRIVATE_KEY,
            ELFA_AI_API_KEY: env.ELFA_AI_API_KEY,
        });

        const tools = createSolanaTools(solanaKit);
        const memory = new MemorySaver();
        const config = { configurable: { thread_id: userId } };

        // dynamic import createReactAgent inside the handler
        const { createReactAgent } = await import("@langchain/langgraph/prebuilt");

        const agent = createReactAgent({
            llm,
            tools,
            checkpointSaver: memory,
            messageModifier: `
        You are a helpful agent that can interact onchain using the Solana Agent Kit. You are
        empowered to interact onchain using your tools. If you ever need funds, you can request them from the
        faucet. If not, you can provide your wallet details and request funds from the user. If there is a 5XX
        (internal) HTTP error code, ask the user to try again later. If someone asks you to do something you
        can't do with your currently available tools, you must say so, and encourage them to implement it
        themselves using the Solana Agent Kit, recommend they go to https://www.solanaagentkit.xyz for more information. Be
        concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.
      `,
        });
        return { agent, config };
    } catch (error) {
        console.error("Failed to initialize agent:", error);
        throw error;
    }
}
