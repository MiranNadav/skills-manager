import { Module } from "@nestjs/common";
import { AiService } from "./ai.service.js";
import { ClaudeProvider } from "./providers/claude.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { AI_PROVIDER_TOKEN } from "./providers/ai-provider.interface.js";
import { APP_CONFIG } from "../../config.js";
import type { AppConfig } from "../../config.js";
import type { AiProvider } from "./providers/ai-provider.interface.js";

@Module({
  providers: [
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: (config: AppConfig): AiProvider => {
        if (config.AI_PROVIDER === "gemini") {
          return new GeminiProvider(config);
        }
        return new ClaudeProvider(config);
      },
      inject: [APP_CONFIG],
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
