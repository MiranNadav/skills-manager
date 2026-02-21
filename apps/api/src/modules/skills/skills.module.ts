import { Module } from "@nestjs/common";
import { SkillsController } from "./skills.controller.js";
import { SkillsService } from "./skills.service.js";
import { SkillFileService } from "./skill-file.service.js";
import { SkillParserService } from "./skill-parser.service.js";

@Module({
  controllers: [SkillsController],
  providers: [SkillsService, SkillFileService, SkillParserService],
  exports: [SkillsService],
})
export class SkillsModule {}
