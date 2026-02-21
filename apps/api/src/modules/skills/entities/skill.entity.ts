export interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  [key: string]: unknown;
}

export interface SkillRule {
  filename: string;
  content: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface Skill {
  /** Directory name, used as the URL slug */
  id: string;
  name: string;
  description: string;
  frontmatter: SkillFrontmatter;
  /** Markdown body of SKILL.md (without frontmatter) */
  content: string;
  /** Full raw text of SKILL.md */
  rawContent: string;
  rules: SkillRule[];
  referenceFiles: string[];
  hasAgentsMd: boolean;
  skillPath: string;
  updatedAt: Date;
}

export interface SkillSummary {
  id: string;
  name: string;
  description: string;
  ruleCount: number;
  referenceCount: number;
  hasAgentsMd: boolean;
  updatedAt: Date;
}
