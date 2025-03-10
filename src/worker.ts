import { Bot, webhookCallback, type Context } from "grammy";
import { HumanMessage } from "@langchain/core/messages";
import { initializeAgent } from "./agent";

// increase timeout to 20 seconds so that image generation task can be completed
const TIMEOUT_MS = 20 * 1000;

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
    async fetch(request: Request, env: Env): Promise<Response> {
        const token = env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");
        }

        const bot = new Bot(token);

        // Telegram bot handler
        bot.on("message:text", async (ctx: Context) => {
            const userId = ctx.from?.id.toString();
            if (!userId || !ctx.message?.text) {
                return;
            }

            const { agent, config } = await initializeAgent(userId, env);
            console.log("initialized Agent");

            const stream = await agent.stream(
                { messages: [new HumanMessage(ctx.message.text)] },
                config,
            );
            console.log("stream", stream);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS),
            );
            try {
                for await (const chunk of (await Promise.race([
                    stream,
                    timeoutPromise,
                ])) as AsyncIterable<{
                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    agent?: any;
                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    tools?: any;
                }>) {
                    console.log("chunk", chunk);

                    if ("agent" in chunk) {
                        console.log("chunk.agent", chunk.agent);
                        if (chunk.agent.messages[0].content) {
                            await ctx.reply(String(chunk.agent.messages[0].content), {
                                parse_mode: "Markdown",
                            });
                        }
                    }
                }
            } catch (error: unknown) {
                if (error instanceof Error && error.message === "Timeout") {
                    await ctx.reply(
                        "I'm sorry, the operation took too long and timed out. Please try again.",
                    );
                } else {
                    console.error("Error processing stream:", error);
                    await ctx.reply("I'm sorry, an error occurred while processing your request.");
                }
            }
        });

        const handler = webhookCallback(bot, "cloudflare-mod", {
            timeoutMilliseconds: TIMEOUT_MS,
            onTimeout: () => {
                console.error("Timeout");
                return new Response("Timeout", { status: 408 });
            },
        });

        return handler(request);
    },
};
