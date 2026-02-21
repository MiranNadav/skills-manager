import { Injectable, Inject } from "@nestjs/common";
import type { Logger } from "@internal/core/logger";
import { APP_LOGGER } from "../../common/interceptors/logging.interceptor.js";
import { AI_PROVIDER_TOKEN } from "./providers/ai-provider.interface.js";
import type { AiProvider, AiCompletionOptions, AiCompletionResult } from "./providers/ai-provider.interface.js";
import type { Skill, SkillSummary } from "../skills/entities/skill.entity.js";

export interface DuplicateReport {
  skill1: string;
  skill2: string;
  similarity: string;
  explanation: string;
}

export interface ConnectionReport {
  theme: string;
  skills: string[];
  description: string;
}

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly provider: AiProvider,
    @Inject(APP_LOGGER) private readonly logger: Logger,
  ) {}

  get providerName(): string {
    return this.provider.providerName;
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    this.logger.debug("Calling AI provider", {
      provider: this.provider.providerName,
      messageCount: options.messages.length,
    });
    return this.provider.complete(options);
  }

  async summarizeSkill(skill: Skill | SkillSummary): Promise<string> {
    const content = "content" in skill ? skill.content : "";
    const ruleCount = "ruleCount" in skill ? skill.ruleCount : 0;

    const result = await this.complete({
      messages: [
        {
          role: "user",
          content: `Summarize this Claude agent skill in 2-3 sentences for a developer who is unfamiliar with it. Be concise and focus on what it does and when to use it.

Skill name: ${skill.name}
Description: ${skill.description}
Rule count: ${ruleCount}
${content ? `\nContent:\n${content.slice(0, 3000)}` : ""}

Reply with only the summary, no preamble.`,
        },
      ],
      maxTokens: 512,
    });

    return result.content.trim();
  }

  async findDuplicates(skills: SkillSummary[]): Promise<DuplicateReport[]> {
    if (skills.length < 2) return [];

    const skillList = skills
      .map((s) => `- **${s.id}**: ${s.name} — ${s.description}`)
      .join("\n");

    const result = await this.complete({
      messages: [
        {
          role: "user",
          content: `Analyze these Claude agent skills and identify any that have overlapping or duplicate purposes. Only report pairs that genuinely overlap.

Skills:
${skillList}

Return a JSON array. Each item has: skill1 (id), skill2 (id), similarity ("high"|"medium"|"low"), explanation (string).
Return [] if no duplicates found. Return ONLY the JSON array, no other text.`,
        },
      ],
      maxTokens: 2048,
    });

    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      return JSON.parse(cleaned) as DuplicateReport[];
    } catch {
      this.logger.warn("Failed to parse duplicate detection response");
      return [];
    }
  }

  async findConnections(skills: SkillSummary[]): Promise<ConnectionReport[]> {
    if (skills.length === 0) return [];

    const skillList = skills
      .map((s) => `- **${s.id}**: ${s.name} — ${s.description}`)
      .join("\n");

    const result = await this.complete({
      messages: [
        {
          role: "user",
          content: `Group these Claude agent skills into thematic clusters based on their purpose and domain.

Skills:
${skillList}

Return a JSON array. Each item has: theme (string, 2-4 words), skills (array of skill ids), description (1 sentence).
Return ONLY the JSON array, no other text.`,
        },
      ],
      maxTokens: 2048,
    });

    try {
      const cleaned = result.content.trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      return JSON.parse(cleaned) as ConnectionReport[];
    } catch {
      this.logger.warn("Failed to parse connection detection response");
      return [];
    }
  }
}
