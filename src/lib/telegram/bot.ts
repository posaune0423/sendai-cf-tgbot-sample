import { Bot, type Context } from "grammy";
import { HumanMessage } from "@langchain/core/messages";
import { initializeAgent } from "../../agents/main";

// タイムアウト設定（20秒）
const TIMEOUT_MS = 20 * 1000;

/**
 * Telegramボットの初期化と設定
 * @param env 環境変数
 * @returns webhookCallbackハンドラー
 */
export const setupTelegramBot = (env: Env) => {
    // Telegramボットトークンの取得
    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");
    }

    // ボットの作成
    const bot = new Bot(token);

    // テキストメッセージのハンドラー
    bot.on("message:text", async (ctx: Context) => {
        const userId = ctx.from?.id.toString();
        if (!userId || !ctx.message?.text) {
            return;
        }

        try {
            // エージェントの初期化
            const { agent, config } = await initializeAgent(userId, env);
            console.log("Initialized Agent");

            // ユーザーメッセージをエージェントに送信
            const stream = await agent.stream(
                {
                    messages: [new HumanMessage(ctx.message.text)],
                },
                config,
            );
            console.log("Stream created");

            // タイムアウト処理
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), TIMEOUT_MS),
            );

            // ストリームからの応答を処理
            try {
                for await (const chunk of (await Promise.race([
                    stream,
                    timeoutPromise,
                ])) as AsyncIterable<{
                    // biome-ignore lint/suspicious/noExplicitAny: cannot expect
                    agent?: any;
                    // biome-ignore lint/suspicious/noExplicitAny: cannot expect
                    tools?: any;
                }>) {
                    console.log("Received chunk", chunk);

                    if ("agent" in chunk && chunk.agent.messages?.[0]?.content) {
                        await ctx.reply(String(chunk.agent.messages[0].content), {
                            parse_mode: "Markdown",
                        });
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

    return bot;
};
