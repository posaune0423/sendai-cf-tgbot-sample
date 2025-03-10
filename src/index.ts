import { Bot, webhookCallback, Context } from 'grammy'
import { ChatOpenAI } from '@langchain/openai'
import { MemorySaver } from '@langchain/langgraph'
import { HumanMessage } from '@langchain/core/messages'

const TIMEOUT_MS = 20 * 1000

async function initializeAgent(userId: string, env: Env) {
  try {
    // SolanaAgentKitをここでインポートして、ハンドラー内で使用する
    const { SolanaAgentKit, createSolanaTools } = await import(
      'solana-agent-kit'
    )

    const llm = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      apiKey: env.OPENAI_API_KEY,
    })

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
    })

    const tools = createSolanaTools(solanaKit)
    const memory = new MemorySaver()
    const config = { configurable: { thread_id: userId } }

    // createReactAgentも動的にインポートする
    const { createReactAgent } = await import('@langchain/langgraph/prebuilt')

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
    })
    return { agent, config }
  } catch (error) {
    console.error('Failed to initialize agent:', error)
    throw error
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
  fetch(request: Request, env: Env): Promise<Response> {
    const token = env.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN environment variable not found.')
    }

    const bot = new Bot(token)

    bot.command('start', async (ctx) => {
      await ctx.reply("Hello! I'm a Daiko AI")
    })

    // Telegram bot handler
    bot.on('message:text', async (ctx: Context) => {
      const userId = ctx.from?.id.toString()
      if (!userId || !ctx.message?.text) {
        return
      }

      const { agent, config } = await initializeAgent(userId, env)
      console.log('initialized Agent')

      const stream = await agent.stream(
        { messages: [new HumanMessage(ctx.message.text)] },
        config
      )
      console.log('stream', stream)

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
      )
      try {
        for await (const chunk of (await Promise.race([
          stream,
          timeoutPromise,
        ])) as AsyncIterable<{
          agent?: any
          tools?: any
        }>) {
          console.log('chunk', chunk)

          if ('agent' in chunk) {
            console.log('chunk.agent', chunk.agent)
            if (chunk.agent.messages[0].content) {
              await ctx.reply(String(chunk.agent.messages[0].content), {
                parse_mode: 'Markdown',
              })
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Timeout') {
          await ctx.reply(
            "I'm sorry, the operation took too long and timed out. Please try again."
          )
        } else {
          console.error('Error processing stream:', error)
          await ctx.reply(
            "I'm sorry, an error occurred while processing your request."
          )
        }
      }
    })

    const handler = webhookCallback(bot, 'cloudflare-mod', {
      timeoutMilliseconds: TIMEOUT_MS,
      onTimeout: () => {
        console.log('Timeout')
        return new Response('Timeout', { status: 408 })
      },
    })

    return handler(request)
  },
}
