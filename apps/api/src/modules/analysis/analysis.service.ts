import { Injectable, Inject } from "@nestjs/common";
import type { Logger } from "@internal/core/logger";
import { APP_LOGGER } from "../../common/interceptors/logging.interceptor.js";
import { SkillsService } from "../skills/skills.service.js";
import { AiService } from "../ai/ai.service.js";
import type { DuplicateReport, ConnectionReport } from "../ai/ai.service.js";

export interface SkillSummaryResult {
  slug: string;
  summary: string;
  provider: string;
}

export interface DuplicatesResult {
  duplicates: DuplicateReport[];
  provider: string;
  skillsAnalyzed: number;
}

export interface ConnectionsResult {
  connections: ConnectionReport[];
  provider: string;
  skillsAnalyzed: number;
}

@Injectable()
export class AnalysisService {
  constructor(
    @Inject(APP_LOGGER) private readonly logger: Logger,
    private readonly skillsService: SkillsService,
    private readonly aiService: AiService,
  ) {}

  async summarizeSkill(slug: string): Promise<SkillSummaryResult> {
    this.logger.info("Generating skill summary", { slug });
    const skill = await this.skillsService.findOne(slug);
    const summary = await this.aiService.summarizeSkill(skill);
    return { slug, summary, provider: this.aiService.providerName };
  }

  async findDuplicates(): Promise<DuplicatesResult> {
    this.logger.info("Running duplicate detection");
    const skills = await this.skillsService.findAll();
    const duplicates = await this.aiService.findDuplicates(skills);
    return { duplicates, provider: this.aiService.providerName, skillsAnalyzed: skills.length };
  }

  async findConnections(): Promise<ConnectionsResult> {
    this.logger.info("Running connection detection");
    const skills = await this.skillsService.findAll();
    const connections = await this.aiService.findConnections(skills);
    return { connections, provider: this.aiService.providerName, skillsAnalyzed: skills.length };
  }
}
