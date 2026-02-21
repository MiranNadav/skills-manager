import { Injectable } from "@nestjs/common";
import matter from "gray-matter";
import type { SkillFrontmatter } from "./entities/skill.entity.js";

@Injectable()
export class SkillParserService {
  /**
   * Parses a SKILL.md file into frontmatter + body.
   * Gracefully handles missing or malformed frontmatter.
   */
  parseSkillFile(rawContent: string): {
    frontmatter: SkillFrontmatter;
    body: string;
  } {
    const { data, content } = matter(rawContent);

    const frontmatter: SkillFrontmatter = {
      name: typeof data["name"] === "string" ? data["name"] : "Unnamed Skill",
      description:
        typeof data["description"] === "string"
          ? data["description"]
          : "No description",
      ...data,
    };

    return { frontmatter, body: content.trim() };
  }

  /**
   * Parses a rule file into frontmatter metadata + body.
   */
  parseRuleFile(rawContent: string): {
    frontmatter: Record<string, unknown>;
    body: string;
  } {
    const { data, content } = matter(rawContent);
    return { frontmatter: data as Record<string, unknown>, body: content.trim() };
  }
}
