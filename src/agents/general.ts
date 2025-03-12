import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { gpt4o } from "../utils/model";
import { memory, type solanaAgentState } from "../utils/state";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

// Initialize tools array
const tools = [];

// Only add Tavily search if API key is available
if (process.env.TAVILY_API_KEY) {
    tools.push(new TavilySearchResults());
}

const generalAgent = createReactAgent({
    llm: gpt4o,
    tools,
    checkpointSaver: memory,
});

export const generalistNode = async (state: typeof solanaAgentState.State) => {
    const { messages } = state;

    const result = await generalAgent.invoke({ messages });

    return { messages: [...result.messages] };
};
