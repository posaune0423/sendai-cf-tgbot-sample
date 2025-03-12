import { StateGraph } from "@langchain/langgraph";
import { solanaAgentState } from "../utils/state";
import { START, END } from "@langchain/langgraph";
import { generalistNode } from "./general";

export async function iniGraph(userId: string) {
    try {
        const config = { configurable: { thread_id: userId } };

        const workflow = new StateGraph(solanaAgentState)
            .addNode("generalist", generalistNode)
            .addEdge(START, "generalist")
            .addEdge("generalist", END);

        const graph = workflow.compile();

        return { graph, config };
    } catch (error) {
        console.error("Failed to initialize agent:", error);
        throw error;
    }
}
