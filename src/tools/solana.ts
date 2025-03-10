export const solanaTools = async (env: Env) => {
    const { SolanaAgentKit, createSolanaTools } = await import("solana-agent-kit");

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
    return tools;
};
