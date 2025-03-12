import type { Bot, Context } from "grammy";
import { iniGraph, initAgent } from "../../agents/main";
import { HumanMessage } from "@langchain/core/messages";
import { TIMEOUT_MS } from "../../constants";
import type { StreamChunk } from "../../types";

export const setupHandler = (bot: Bot) => {
    bot.on("message:text", async (ctx: Context) => {
        const userId = ctx.from?.id.toString();
        if (!userId || !ctx.message?.text) {
            return;
        }

        try {
            // initialize agent
            // const { agent, config } = await iniGraph(userId);
            // console.log("Initialized Graph");

            const { agent, config } = await initAgent(userId);
            console.log("Initialized Agent");

            // send user message to agent
            const stream = await agent.stream(
                {
                    messages: [new HumanMessage(ctx.message.text)],
                },
                config,
            );
            console.log("Stream created");

            // timeout processing
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS),
            );

            // process response from stream
            try {
                for await (const chunk of (await Promise.race([
                    stream,
                    timeoutPromise,
                ])) as AsyncIterable<StreamChunk>) {
                    console.log(chunk.agent.messages);

                    if ("agent" in chunk) {
                        const lastIndex = chunk.agent.messages.length - 1;
                        if (chunk.agent.messages[lastIndex].content) {
                            await ctx.reply(String(chunk.agent.messages[lastIndex].content));
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
        } catch (error) {
            console.error("Error initializing agent:", error);
            await ctx.reply("I'm sorry, an error occurred while initializing the agent.");
        }
    });
};
