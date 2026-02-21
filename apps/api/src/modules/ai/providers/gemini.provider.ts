import { GoogleGenerativeAI } from "@google/generative-ai";
import { Injectable, Inject } from "@nestjs/common";
import type { AppConfig } from "../../../config.js";
import { APP_CONFIG } from "../../../config.js";
import type { AiProvider, AiCompletionOptions, AiCompletionResult } from "./ai-provider.interface.js";

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly genAI: GoogleGenerativeAI;
  readonly providerName = "gemini";

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    if (!config.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini");
    }
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const model = this.genAI.getGenerativeModel({ model: this.config.AI_MODEL_GEMINI });

    // Convert AiMessage[] to Gemini format
    const history = options.messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const lastMessage = options.messages[options.messages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage?.content ?? "");
    const response = result.response;

    return {
      content: response.text(),
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      model: this.config.AI_MODEL_GEMINI,
      provider: this.providerName,
    };
  }
}
