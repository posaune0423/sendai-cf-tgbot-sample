export type StreamChunk = {
    generalist: {
        messages: {
            content: string;
        }[];
    };
    tool_calls: {
        name: string;
        args: {
            input: string;
        };
        type: string;
        id: string;
    }[];
    usage_metadata: {
        output_tokens: number;
        input_tokens: number;
        total_tokens: number;
    };
};
