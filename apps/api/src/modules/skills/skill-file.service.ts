import { Injectable, Inject } from "@nestjs/common";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { NotFoundError } from "../../core/errors.js";
import type { AppConfig } from "../../config.js";
import { APP_CONFIG } from "../../config.js";

@Injectable()
export class SkillFileService {
  private readonly skillsPath: string;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    this.skillsPath = config.SKILLS_PATH;
  }

  /** Lists all skill directory names in SKILLS_PATH. */
  async listSkillSlugs(): Promise<string[]> {
    const entries = await readdir(this.skillsPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() || e.isSymbolicLink())
      .map((e) => e.name)
      .filter((name) => !name.startsWith("."));
  }

  /** Reads the raw content of SKILL.md for a given skill. */
  async readSkillMd(slug: string): Promise<{ content: string; updatedAt: Date }> {
    const filePath = this.safeJoin(slug, "SKILL.md");
    try {
      const [content, stats] = await Promise.all([
        readFile(filePath, "utf-8"),
        stat(filePath),
      ]);
      return { content, updatedAt: stats.mtime };
    } catch {
      throw new NotFoundError("Skill", slug);
    }
  }

  /** Reads all rule filenames and contents from a skill's rules/ directory. */
  async readRules(
    slug: string,
  ): Promise<Array<{ filename: string; content: string }>> {
    const rulesDir = this.safeJoin(slug, "rules");
    try {
      const entries = await readdir(rulesDir);
      const mdFiles = entries.filter((f) => f.endsWith(".md"));
      return Promise.all(
        mdFiles.map(async (filename) => {
          const content = await readFile(join(rulesDir, filename), "utf-8");
          return { filename, content };
        }),
      );
    } catch {
      return [];
    }
  }

  /** Lists reference filenames from a skill's references/ directory. */
  async listReferenceFiles(slug: string): Promise<string[]> {
    const refsDir = this.safeJoin(slug, "references");
    try {
      const entries = await readdir(refsDir);
      return entries.filter((f) => f.endsWith(".md"));
    } catch {
      return [];
    }
  }

  /** Checks whether AGENTS.md exists in a skill directory. */
  async hasAgentsMd(slug: string): Promise<boolean> {
    try {
      await stat(this.safeJoin(slug, "AGENTS.md"));
      return true;
    } catch {
      return false;
    }
  }

  /** Reads a reference file's content. */
  async readReferenceFile(slug: string, filename: string): Promise<string> {
    const safeFilename = basename(filename);
    const filePath = this.safeJoin(slug, "references", safeFilename);
    try {
      return await readFile(filePath, "utf-8");
    } catch {
      throw new NotFoundError("Reference file", `${slug}/references/${safeFilename}`);
    }
  }

  /** Writes new content to SKILL.md. Path-sandboxed to SKILLS_PATH. */
  async writeSkillMd(slug: string, content: string): Promise<void> {
    const filePath = this.safeJoin(slug, "SKILL.md");
    await writeFile(filePath, content, "utf-8");
  }

  /** Writes new content to a rule file. */
  async writeRuleFile(
    slug: string,
    filename: string,
    content: string,
  ): Promise<void> {
    const safeFilename = basename(filename);
    const filePath = this.safeJoin(slug, "rules", safeFilename);
    await writeFile(filePath, content, "utf-8");
  }

  /**
   * Safely joins SKILLS_PATH with the given path segments.
   * Throws if the resolved path escapes SKILLS_PATH (traversal prevention).
   */
  private safeJoin(...segments: string[]): string {
    const resolved = resolve(this.skillsPath, ...segments);
    if (!resolved.startsWith(this.skillsPath)) {
      throw new Error(`Path traversal detected: ${resolved}`);
    }
    return resolved;
  }
}
