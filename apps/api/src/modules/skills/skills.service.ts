import { Injectable, Inject } from "@nestjs/common";
import type { Logger } from "@internal/core/logger";
import { NotFoundError } from "@internal/core/errors";
import { APP_LOGGER } from "../../common/interceptors/logging.interceptor.js";
import { SkillFileService } from "./skill-file.service.js";
import { SkillParserService } from "./skill-parser.service.js";
import type { Skill, SkillRule, SkillSummary } from "./entities/skill.entity.js";

@Injectable()
export class SkillsService {
  constructor(
    @Inject(APP_LOGGER) private readonly logger: Logger,
    private readonly fileService: SkillFileService,
    private readonly parser: SkillParserService,
  ) {}

  async findAll(): Promise<SkillSummary[]> {
    const slugs = await this.fileService.listSkillSlugs();
    this.logger.info("Listing skills", { count: slugs.length });
    const skills = await Promise.all(slugs.map((slug) => this.loadSummary(slug)));
    return skills.filter((s): s is SkillSummary => s !== null);
  }

  async findOne(slug: string): Promise<Skill> {
    this.logger.info("Loading skill", { slug });
    const [{ content: rawContent, updatedAt }, rules, referenceFiles, agentsMd] =
      await Promise.all([
        this.fileService.readSkillMd(slug),
        this.loadRules(slug),
        this.fileService.listReferenceFiles(slug),
        this.fileService.hasAgentsMd(slug),
      ]);

    const { frontmatter, body } = this.parser.parseSkillFile(rawContent);

    return {
      id: slug,
      name: frontmatter.name,
      description: frontmatter.description,
      frontmatter,
      content: body,
      rawContent,
      rules,
      referenceFiles,
      hasAgentsMd: agentsMd,
      skillPath: `${this.fileService["skillsPath"]}/${slug}`,
      updatedAt,
    };
  }

  async updateSkillContent(slug: string, content: string): Promise<Skill> {
    await this.fileService.readSkillMd(slug);
    await this.fileService.writeSkillMd(slug, content);
    this.logger.info("Updated skill content", { slug });
    return this.findOne(slug);
  }

  async updateRule(slug: string, filename: string, content: string): Promise<SkillRule> {
    await this.fileService.writeRuleFile(slug, filename, content);
    this.logger.info("Updated rule file", { slug, filename });
    const { frontmatter, body } = this.parser.parseRuleFile(content);
    return { filename, content, frontmatter, body };
  }

  async getReferenceContent(slug: string, filename: string): Promise<string> {
    return this.fileService.readReferenceFile(slug, filename);
  }

  private async loadSummary(slug: string): Promise<SkillSummary | null> {
    try {
      const { content: rawContent, updatedAt } = await this.fileService.readSkillMd(slug);
      const { frontmatter } = this.parser.parseSkillFile(rawContent);
      const [rules, refs, agentsMd] = await Promise.all([
        this.fileService.readRules(slug),
        this.fileService.listReferenceFiles(slug),
        this.fileService.hasAgentsMd(slug),
      ]);
      return {
        id: slug,
        name: frontmatter.name,
        description: frontmatter.description,
        ruleCount: rules.length,
        referenceCount: refs.length,
        hasAgentsMd: agentsMd,
        updatedAt,
      };
    } catch {
      this.logger.warn("Skipping skill directory without SKILL.md", { slug });
      return null;
    }
  }

  private async loadRules(slug: string): Promise<SkillRule[]> {
    const rawRules = await this.fileService.readRules(slug);
    return rawRules.map(({ filename, content }) => {
      const { frontmatter, body } = this.parser.parseRuleFile(content);
      return { filename, content, frontmatter, body };
    });
  }
}
