import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import { UsageService } from "./usage.service.js";

@ApiTags("usage")
@Controller("usage")
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get()
  @ApiOperation({ summary: "Get skill usage stats across all Claude Code conversations" })
  @ApiResponse({ status: 200, description: "Usage stats per skill, sorted by count desc" })
  getAll() {
    return this.usageService.getUsageStats();
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get usage stats for a single skill" })
  @ApiParam({ name: "slug", description: "Skill ID (directory name)" })
  @ApiResponse({ status: 200, description: "Usage stats for the skill" })
  getOne(@Param("slug") slug: string) {
    return this.usageService.getSkillUsage(slug);
  }
}
