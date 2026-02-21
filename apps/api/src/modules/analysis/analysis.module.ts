import { Module } from "@nestjs/common";
import { AnalysisController } from "./analysis.controller.js";
import { AnalysisService } from "./analysis.service.js";
import { SkillsModule } from "../skills/skills.module.js";
import { AiModule } from "../ai/ai.module.js";

@Module({
  imports: [SkillsModule, AiModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
