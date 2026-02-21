import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AppController } from "./app.controller.js";
import { CoreModule } from "./core.module.js";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter.js";
import { ContextInterceptor } from "./common/interceptors/context.interceptor.js";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor.js";
import { SkillsModule } from "./modules/skills/skills.module.js";
import { AiModule } from "./modules/ai/ai.module.js";
import { AnalysisModule } from "./modules/analysis/analysis.module.js";
import { CliModule } from "./modules/cli/cli.module.js";
import { UsageModule } from "./modules/usage/usage.module.js";

@Module({
  imports: [CoreModule, SkillsModule, AiModule, AnalysisModule, CliModule, UsageModule],
  controllers: [AppController],
  providers: [
    // Order matters: ContextInterceptor first, then LoggingInterceptor
    { provide: APP_INTERCEPTOR, useClass: ContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
