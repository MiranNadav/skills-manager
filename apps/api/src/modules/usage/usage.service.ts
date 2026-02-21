import { Injectable, Inject } from "@nestjs/common";
import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import type { Logger } from "@internal/core/logger";
import { APP_LOGGER } from "../../common/interceptors/logging.interceptor.js";
import { APP_CONFIG } from "../../config.js";
import type { AppConfig } from "../../config.js";

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

interface CacheFile {
  version: number;
  lastScanned: string;
  filesMtimes: Record<string, number>;
  invocations: SkillInvocation[];
}

interface ParsedMessage {
  type?: string;
  timestamp?: string;
  sessionId?: string;
  cwd?: string;
  message?: {
    content?: unknown;
  };
}

@Injectable()
export class UsageService {
  private readonly claudeProjectsPath: string;
  private readonly cachePath: string;

  constructor(
    @Inject(APP_LOGGER) private readonly logger: Logger,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    this.claudeProjectsPath = join(homedir(), ".claude", "projects");
    this.cachePath = config.USAGE_CACHE_PATH;
  }

  async getUsageStats(): Promise<SkillUsageStats[]> {
    this.logger.info("Fetching skill usage stats");

    const cache = await this.loadCache();
    const jsonlFiles = await this.findJsonlFiles();

    const filesToParse: string[] = [];
    for (const filePath of jsonlFiles) {
      try {
        const { mtimeMs } = await stat(filePath);
        const cachedMtime = cache.filesMtimes[filePath] ?? 0;
        if (mtimeMs > cachedMtime) {
          filesToParse.push(filePath);
        }
      } catch {
        // file disappeared between listing and stat — skip
      }
    }

    if (filesToParse.length > 0) {
      this.logger.info("Parsing new/changed JSONL files", { count: filesToParse.length });

      const updatedMtimes: Record<string, number> = { ...cache.filesMtimes };
      const newInvocations: SkillInvocation[] = [];

      for (const filePath of filesToParse) {
        try {
          const { mtimeMs } = await stat(filePath);
          const invs = await this.parseFile(filePath);
          newInvocations.push(...invs);
          updatedMtimes[filePath] = mtimeMs;
        } catch (err) {
          this.logger.warn("Failed to parse JSONL file", { filePath, err: String(err) });
        }
      }

      // Merge and deduplicate by (sessionId, timestamp, skillId)
      const seen = new Set<string>();
      const merged: SkillInvocation[] = [];
      for (const inv of [...cache.invocations, ...newInvocations]) {
        const key = `${inv.sessionId}:${inv.timestamp}:${inv.skillId}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(inv);
        }
      }

      await this.saveCache({
        version: 1,
        lastScanned: new Date().toISOString(),
        filesMtimes: updatedMtimes,
        invocations: merged,
      });

      return this.aggregate(merged);
    }

    this.logger.info("Returning cached usage stats (no changes detected)");
    return this.aggregate(cache.invocations);
  }

  async getSkillUsage(skillId: string): Promise<SkillUsageStats> {
    const all = await this.getUsageStats();
    return (
      all.find((s) => s.skillId === skillId) ?? {
        skillId,
        count: 0,
        lastUsed: null,
        invocations: [],
      }
    );
  }

  // --- Private helpers ---

  private aggregate(invocations: SkillInvocation[]): SkillUsageStats[] {
    const bySkill = new Map<string, SkillInvocation[]>();
    for (const inv of invocations) {
      const list = bySkill.get(inv.skillId) ?? [];
      list.push(inv);
      bySkill.set(inv.skillId, list);
    }

    const stats: SkillUsageStats[] = [];
    for (const [skillId, invs] of bySkill) {
      const sorted = [...invs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      stats.push({
        skillId,
        count: invs.length,
        lastUsed: sorted[0]?.timestamp ?? null,
        invocations: sorted,
      });
    }

    return stats.sort((a, b) => b.count - a.count);
  }

  private async loadCache(): Promise<CacheFile> {
    try {
      const raw = await readFile(this.cachePath, "utf-8");
      const parsed = JSON.parse(raw) as CacheFile;
      if (parsed.version === 1 && Array.isArray(parsed.invocations)) {
        return parsed;
      }
    } catch {
      // cache missing or corrupt — start fresh
    }
    return { version: 1, lastScanned: "", filesMtimes: {}, invocations: [] };
  }

  private async saveCache(data: CacheFile): Promise<void> {
    try {
      await mkdir(dirname(this.cachePath), { recursive: true });
      await writeFile(this.cachePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      this.logger.warn("Failed to write usage cache", { err: String(err) });
    }
  }

  private async findJsonlFiles(): Promise<string[]> {
    const results: string[] = [];
    try {
      await this.walkDir(this.claudeProjectsPath, results);
    } catch {
      this.logger.warn("Could not read Claude projects directory", {
        path: this.claudeProjectsPath,
      });
    }
    return results;
  }

  private async walkDir(dir: string, results: string[]): Promise<void> {
    let entries: { name: string; isDirectory: () => boolean; isFile: () => boolean }[];
    try {
      entries = await readdir(dir, { withFileTypes: true, encoding: "utf-8" }) as unknown as {
        name: string;
        isDirectory: () => boolean;
        isFile: () => boolean;
      }[];
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "subagents") continue;
        await this.walkDir(fullPath, results);
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        results.push(fullPath);
      }
    }
  }

  private async parseFile(filePath: string): Promise<SkillInvocation[]> {
    const raw = await readFile(filePath, "utf-8");
    const lines = raw.split("\n").filter((l) => l.trim());

    const messages: ParsedMessage[] = [];
    for (const line of lines) {
      try {
        messages.push(JSON.parse(line) as ParsedMessage);
      } catch {
        // malformed line — skip
      }
    }

    const invocations: SkillInvocation[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || msg.type !== "assistant") continue;

      const content = msg.message?.content;
      if (!Array.isArray(content)) continue;

      for (const item of content) {
        if (
          typeof item !== "object" ||
          item === null ||
          (item as Record<string, unknown>)["type"] !== "tool_use" ||
          (item as Record<string, unknown>)["name"] !== "Skill"
        ) {
          continue;
        }

        const input = (item as Record<string, unknown>)["input"] as
          | Record<string, unknown>
          | undefined;
        const skillId = typeof input?.["skill"] === "string" ? (input["skill"] as string) : null;
        if (!skillId) continue;

        const prompt = this.extractTriggerPrompt(messages, i);
        const cwd = msg.cwd ?? "";

        invocations.push({
          skillId,
          timestamp: msg.timestamp ?? new Date().toISOString(),
          cwd,
          project: this.friendlyProject(cwd),
          sessionId: msg.sessionId ?? "",
          prompt,
        });
      }
    }

    return invocations;
  }

  private extractTriggerPrompt(messages: ParsedMessage[], assistantIndex: number): string | null {
    for (let j = assistantIndex - 1; j >= Math.max(assistantIndex - 30, 0); j--) {
      const msg = messages[j];
      if (!msg || msg.type !== "user") continue;

      const content = msg.message?.content;
      let text: string | null = null;

      if (typeof content === "string") {
        text = content;
      } else if (Array.isArray(content)) {
        const isOnlyToolResults = content.every(
          (p): boolean =>
            typeof p === "object" &&
            p !== null &&
            (p as Record<string, unknown>)["type"] === "tool_result",
        );
        if (isOnlyToolResults) continue;

        const textParts = content
          .filter(
            (p): boolean =>
              typeof p === "object" &&
              p !== null &&
              (p as Record<string, unknown>)["type"] === "text",
          )
          .map((p) => String((p as Record<string, unknown>)["text"] ?? ""));
        text = textParts.join(" ");
      }

      if (text && text.trim()) {
        return this.cleanPrompt(text.trim());
      }
    }
    return null;
  }

  private cleanPrompt(raw: string): string {
    return raw
      .replace(/<[a-zA-Z_-]+[^>]*>[\s\S]*?<\/[a-zA-Z_-]+>/g, "")
      .replace(/<[a-zA-Z_-]+[^>]*\/>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
  }

  private friendlyProject(cwd: string): string {
    if (!cwd) return "unknown";
    const parts = cwd.replace(/\/+$/, "").split("/").filter(Boolean);
    return parts.slice(-2).join("/") || cwd;
  }
}
