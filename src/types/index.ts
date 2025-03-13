export type StreamChunk = {
    agent: {
        messages: {
            content: string;
            tool_calls: {
                name: string;
                args: {
                    input: string;
                };
                type: string;
                id: string;
            }[];
            usage_metadata?: {
                output_tokens: number;
                input_tokens: number;
                total_tokens: number;
            };
        }[];
    };
};

/** Enum defining available log levels */
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
}

/** Interface for custom log writers */
export interface LogWriter {
    init(logPath: string): void;
    write(data: string): void;
}

/** Configuration options for logging */
export interface LoggerConfig {
    level: LogLevel;
    enableTimestamp?: boolean;
    enableColors?: boolean;
    logToFile?: boolean;
    logPath?: string;
    logWriter?: LogWriter;
}

/** Structure of a log entry */
export interface LogEntry {
    level: LogLevel;
    timestamp: Date;
    context: string;
    message: string;
    // biome-ignore lint/suspicious/noExplicitAny: data could be anything
    data?: any;
}
