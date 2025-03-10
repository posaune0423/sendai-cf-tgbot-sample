import { ChatOpenAI } from "@langchain/openai";

export const gpt4o = (apiKey: string) =>
    new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0.7,
        apiKey,
    });

export const gpt4oMini = (apiKey: string) =>
    new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0.7,
        apiKey,
    });
