import { Controller, Get, Post, Query, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";
import { CliService } from "./cli.service.js";

class InstallSkillDto {
  @ApiProperty({ description: "Skill package reference", example: "owner/repo@skill-name" })
  @IsString()
  @MinLength(1)
  package!: string;
}

@ApiTags("cli")
@Controller("cli")
export class CliController {
  constructor(private readonly cliService: CliService) {}

  @Get("find")
  @ApiOperation({ summary: "Search for installable skills" })
  @ApiQuery({ name: "q", description: "Search query" })
  @ApiResponse({ status: 200, description: "CLI output" })
  findSkills(@Query("q") query: string) {
    return this.cliService.findSkills(query ?? "");
  }

  @Post("install")
  @ApiOperation({ summary: "Install a skill" })
  @ApiResponse({ status: 201, description: "Install result" })
  installSkill(@Body() dto: InstallSkillDto) {
    return this.cliService.installSkill(dto.package);
  }

  @Get("updates")
  @ApiOperation({ summary: "Check for skill updates" })
  @ApiResponse({ status: 200, description: "Update check result" })
  checkUpdates() {
    return this.cliService.checkUpdates();
  }

  @Post("update")
  @ApiOperation({ summary: "Update all installed skills" })
  @ApiResponse({ status: 201, description: "Update result" })
  updateAll() {
    return this.cliService.updateAll();
  }
}
