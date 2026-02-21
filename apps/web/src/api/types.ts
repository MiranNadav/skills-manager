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
  id: string;
  name: string;
  description: string;
  frontmatter: SkillFrontmatter;
  content: string;
  rawContent: string;
  rules: SkillRule[];
  referenceFiles: string[];
  hasAgentsMd: boolean;
  skillPath: string;
  updatedAt: string;
}

export interface SkillSummary {
  id: string;
  name: string;
  description: string;
  ruleCount: number;
  referenceCount: number;
  hasAgentsMd: boolean;
  updatedAt: string;
}

export interface SkillSummaryResult {
  slug: string;
  summary: string;
  provider: string;
}

export interface DuplicateReport {
  skill1: string;
  skill2: string;
  similarity: "high" | "medium" | "low";
  explanation: string;
}

export interface ConnectionReport {
  theme: string;
  skills: string[];
  description: string;
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

export interface CliResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

export interface SkillInvocation {
  skillId: string;
  timestamp: string;
  cwd: string;
  project: string;
  sessionId: string;
  prompt: string | null;
}

export interface SkillUsageStats {
  skillId: string;
  count: number;
  lastUsed: string | null;
  invocations: SkillInvocation[];
}
