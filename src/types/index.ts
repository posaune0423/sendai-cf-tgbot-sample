export type StreamChunk = {
    agent: {
        messages: {
            content: string;
            usage_metadata: {
                output_tokens: number;
                input_tokens: number;
                total_tokens: number;
            };
            tool_calls: {
                name: string;
                args: {
                    input: string;
                };
                type: string;
                id: string;
            }[];
        }[];
    };
};
