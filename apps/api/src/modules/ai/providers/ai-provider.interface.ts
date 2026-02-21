export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  messages: AiMessage[];
  maxTokens?: number;
}

export interface AiCompletionResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: string;
}

export interface AiProvider {
  complete(options: AiCompletionOptions): Promise<AiCompletionResult>;
  readonly providerName: string;
}

export const AI_PROVIDER_TOKEN = Symbol("AI_PROVIDER_TOKEN");
