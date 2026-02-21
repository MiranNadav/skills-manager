import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class UpdateSkillDto {
  @ApiProperty({ description: "Full markdown content of SKILL.md" })
  @IsString()
  @MinLength(1)
  content!: string;
}
