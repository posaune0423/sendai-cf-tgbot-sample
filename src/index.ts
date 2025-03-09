import { Bot, webhookCallback } from "grammy";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

export interface Env {
    TELEGRAM_BOT_TOKEN: string;
    SOLANA_PRIVATE_KEY: string;
    RPC_URL: string;
    OPENAI_API_KEY: string;
    ALLORA_API_KEY?: string;
    ALLORA_API_URL?: string;
    PERPLEXITY_API_KEY?: string;
    JUPITER_REFERRAL_ACCOUNT?: string;
    JUPITER_FEE_BPS?: string;
    FLASH_PRIVILEGE?: string;
    HELIUS_API_KEY?: string;
    ETHEREUM_PRIVATE_KEY?: string;
    ELFA_AI_API_KEY?: string;
}

async function initializeAgent(userId: string, env: Env) {
    try {
        // SolanaAgentKitをここでインポートして、ハンドラー内で使用する
        const { SolanaAgentKit, createSolanaTools } = await import("solana-agent-kit");

        const llm = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0.7,
        });

        const solanaKit = new SolanaAgentKit(env.SOLANA_PRIVATE_KEY, env.RPC_URL, {
            OPENAI_API_KEY: env.OPENAI_API_KEY,
        });

        const tools = createSolanaTools(solanaKit);
        const memory = new MemorySaver();
        const config = { configurable: { thread_id: userId } };

        // createReactAgentも動的にインポートする
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

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const token = env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");
        }

        const bot = new Bot(token);

        // Telegram bot handler
        bot.on("message:text", async (ctx: any) => {
            const userId = ctx.from?.id.toString();
            if (!userId) {
                return;
            }
            const { agent, config } = await initializeAgent(userId, env);
            const stream = await agent.stream(
                { messages: [new HumanMessage(ctx.message.text)] },
                config
            );
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 20000)
            );
            try {
                for await (const chunk of (await Promise.race([
                    stream,
                    timeoutPromise,
                ])) as AsyncIterable<{
                    agent?: any;
                    tools?: any;
                }>) {
                    if ("agent" in chunk) {
                        if (chunk.agent.messages[0].content) {
                            await ctx.reply(String(chunk.agent.messages[0].content));
                        }
                    }
                }
            } catch (error: any) {
                if (error.message === "Timeout") {
                    await ctx.reply(
                        "I'm sorry, the operation took too long and timed out. Please try again."
                    );
                } else {
                    console.error("Error processing stream:", error);
                    await ctx.reply("I'm sorry, an error occurred while processing your request.");
                }
            }
        });

        const handler = webhookCallback(bot, "cloudflare-mod");

        return handler(request);
    },
} satisfies ExportedHandler<Env>;
