import { StateGraph } from "@langchain/langgraph";
import { memory, solanaAgentState } from "../utils/state";
import { START, END } from "@langchain/langgraph";
import { generalistNode } from "./general";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { gpt4o } from "../utils/model";
import { mainPrompt } from "../prompts/main";
import { solanaTools } from "../tools/solana";

export async function iniGraph(userId: string) {
    try {
        const config = { configurable: { thread_id: userId } };

        const workflow = new StateGraph(solanaAgentState)
            .addNode("agent", generalistNode)
            .addEdge(START, "agent")
            .addEdge("agent", END);

        const graph = workflow.compile();

        return { agent: graph, config };
    } catch (error) {
        console.error("Failed to initialize agent:", error);
        throw error;
    }
}

export async function initAgent(userId: string) {
    try {
        const config = { configurable: { thread_id: userId } };

        const tools = solanaTools();
        const agent = createReactAgent({
            llm: gpt4o,
            tools,
            checkpointSaver: memory,
            prompt: mainPrompt,
        });

        return { agent, config };
    } catch (error) {
        console.error("Failed to initialize agent:", error);
        throw error;
    }
}
