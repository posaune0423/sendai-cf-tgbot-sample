import { SolanaAgentKit } from "solana-agent-kit";

if (!process.env.SOLANA_PRIVATE_KEY || !process.env.RPC_URL) {
    throw new Error("SOLANA_PRIVATE_KEY or RPC_URL is not set");
}

export const solanaAgent = new SolanaAgentKit(process.env.SOLANA_PRIVATE_KEY, process.env.RPC_URL, {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    ALLORA_API_KEY: process.env.ALLORA_API_KEY,
    ALLORA_API_URL: process.env.ALLORA_API_URL,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    JUPITER_REFERRAL_ACCOUNT: process.env.JUPITER_REFERRAL_ACCOUNT,
    FLASH_PRIVILEGE: process.env.FLASH_PRIVILEGE,
    ETHEREUM_PRIVATE_KEY: process.env.ETHEREUM_PRIVATE_KEY,
    ELFA_AI_API_KEY: process.env.ELFA_AI_API_KEY,
});
