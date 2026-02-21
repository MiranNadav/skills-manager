import { Injectable, Inject } from "@nestjs/common";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { homedir } from "node:os";
import type { Logger } from "@internal/core/logger";
import { ValidationError } from "@internal/core/errors";
import { APP_LOGGER } from "../../common/interceptors/logging.interceptor.js";

const execFileAsync = promisify(execFile);

/** Safe character set for skill package references */
const SAFE_PACKAGE_REF = /^[a-zA-Z0-9\-_./@:]+$/;

export interface CliResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

@Injectable()
export class CliService {
  constructor(@Inject(APP_LOGGER) private readonly logger: Logger) {}

  /** Search for installable skills: npx skills find <query> */
  async findSkills(query: string): Promise<CliResult> {
    this.logger.info("Searching for skills", { query });
    return this.runSkillsCommand(["find", query]);
  }

  /** Install a skill: npx skills add <package> -g -y */
  async installSkill(packageRef: string): Promise<CliResult> {
    if (!SAFE_PACKAGE_REF.test(packageRef)) {
      throw new ValidationError("Invalid package reference format", {
        package: ["Only alphanumeric, -, _, ., /, @, : are allowed"],
      });
    }
    this.logger.info("Installing skill", { packageRef });
    return this.runSkillsCommand(["add", packageRef, "-g", "-y"]);
  }

  /** Check for skill updates: npx skills check */
  async checkUpdates(): Promise<CliResult> {
    this.logger.info("Checking for skill updates");
    return this.runSkillsCommand(["check"]);
  }

  /** Update all skills: npx skills update */
  async updateAll(): Promise<CliResult> {
    this.logger.info("Updating all skills");
    return this.runSkillsCommand(["update", "-g", "-y"]);
  }

  /**
   * Runs `npx skills <args>` using execFile (NOT exec) to prevent
   * shell injection. Args are passed as an array, never interpolated.
   */
  private async runSkillsCommand(args: string[]): Promise<CliResult> {
    try {
      const { stdout, stderr } = await execFileAsync(
        "npx",
        ["--yes", "skills", ...args],
        {
          cwd: homedir(),
          env: process.env as NodeJS.ProcessEnv,
          timeout: 90_000,
        },
      );
      return { stdout, stderr, success: true };
    } catch (err) {
      const error = err as { stdout?: string; stderr?: string; message?: string };
      this.logger.warn("Skills CLI command failed", { args, error: error.message });
      return {
        stdout: error.stdout ?? "",
        stderr: error.stderr ?? error.message ?? "Unknown error",
        success: false,
      };
    }
  }
}
