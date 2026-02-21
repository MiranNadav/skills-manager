import { Controller, Post, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { AnalysisService } from "./analysis.service.js";

@ApiTags("analysis")
@Controller("analysis")
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post("summary/:slug")
  @ApiOperation({ summary: "Generate AI summary for a skill" })
  @ApiParam({ name: "slug", description: "Skill directory name" })
  @ApiResponse({ status: 201, description: "Summary generated" })
  summarizeSkill(@Param("slug") slug: string) {
    return this.analysisService.summarizeSkill(slug);
  }

  @Post("duplicates")
  @ApiOperation({ summary: "Detect duplicate skills across the library" })
  @ApiResponse({ status: 201, description: "Duplicate analysis results" })
  findDuplicates() {
    return this.analysisService.findDuplicates();
  }

  @Post("connections")
  @ApiOperation({ summary: "Find thematic connections between skills" })
  @ApiResponse({ status: 201, description: "Connection analysis results" })
  findConnections() {
    return this.analysisService.findConnections();
  }
}
