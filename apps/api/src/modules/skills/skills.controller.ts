import { Controller, Get, Patch, Param, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { SkillsService } from "./skills.service.js";
import { UpdateSkillDto } from "./dto/update-skill.dto.js";

@ApiTags("skills")
@Controller("skills")
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @ApiOperation({ summary: "List all installed skills (summaries)" })
  @ApiResponse({ status: 200, description: "Array of skill summaries" })
  findAll() {
    return this.skillsService.findAll();
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get a single skill with full content and rules" })
  @ApiParam({ name: "slug", description: "Skill directory name" })
  @ApiResponse({ status: 200, description: "Full skill object" })
  @ApiResponse({ status: 404, description: "Skill not found" })
  findOne(@Param("slug") slug: string) {
    return this.skillsService.findOne(slug);
  }

  @Patch(":slug")
  @ApiOperation({ summary: "Update SKILL.md content" })
  @ApiParam({ name: "slug", description: "Skill directory name" })
  @ApiResponse({ status: 200, description: "Updated skill object" })
  updateSkill(@Param("slug") slug: string, @Body() dto: UpdateSkillDto) {
    return this.skillsService.updateSkillContent(slug, dto.content);
  }

  @Get(":slug/rules/:filename")
  @ApiOperation({ summary: "Get a rule file's content" })
  async getRule(@Param("slug") slug: string, @Param("filename") filename: string) {
    const skill = await this.skillsService.findOne(slug);
    const rule = skill.rules.find((r) => r.filename === filename);
    return rule ?? { content: "", filename, frontmatter: {}, body: "" };
  }

  @Patch(":slug/rules/:filename")
  @ApiOperation({ summary: "Update a rule file's content" })
  updateRule(
    @Param("slug") slug: string,
    @Param("filename") filename: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.skillsService.updateRule(slug, filename, dto.content);
  }

  @Get(":slug/references/:filename")
  @ApiOperation({ summary: "Get a reference file's content" })
  async getReferenceFile(@Param("slug") slug: string, @Param("filename") filename: string) {
    const content = await this.skillsService.getReferenceContent(slug, filename);
    return { filename, content };
  }
}
