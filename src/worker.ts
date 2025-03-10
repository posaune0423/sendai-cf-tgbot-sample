import { webhookCallback } from "grammy";
import { setupTelegramBot } from "./lib/telegram/bot";

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
        const bot = setupTelegramBot(env);

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
