import Anthropic from "@anthropic-ai/sdk";
import { Injectable, Inject } from "@nestjs/common";
import type { AppConfig } from "../../../config.js";
import { APP_CONFIG } from "../../../config.js";
import type { AiProvider, AiCompletionOptions, AiCompletionResult } from "./ai-provider.interface.js";

@Injectable()
export class ClaudeProvider implements AiProvider {
  private readonly client: Anthropic;
  readonly providerName = "claude";

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    if (!config.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=claude");
    }
    this.client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const response = await this.client.messages.create({
      model: this.config.AI_MODEL_CLAUDE,
      max_tokens: options.maxTokens ?? 4096,
      messages: options.messages,
    });

    const content = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    return {
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model,
      provider: this.providerName,
    };
  }
}
