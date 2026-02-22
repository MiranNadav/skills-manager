import { loadConfig } from "./core/config.js";
import { z } from "zod";
import { join } from "node:path";
import { homedir } from "node:os";

/**
 * Application configuration schema. Validates all env vars at startup.
 * Fails fast if any are missing or invalid.
 */
export const AppConfigSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  API_PREFIX: z.string().default("api"),
  ENABLE_SWAGGER: z.coerce.boolean().default(true),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((val) => val.split(",")),

  // Skills filesystem path — defaults to ~/.agents/skills
  // Uses transform so empty string in .env also triggers the default
  SKILLS_PATH: z
    .string()
    .optional()
    .transform((val) => val || join(homedir(), ".agents", "skills")),

  // AI provider config
  AI_PROVIDER: z.enum(["claude", "gemini"]).default("claude"),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_MODEL_CLAUDE: z.string().default("claude-sonnet-4-6"),
  AI_MODEL_GEMINI: z.string().default("gemini-2.0-flash"),

  // Usage tracking — JSON cache for parsed JSONL skill invocations
  USAGE_CACHE_PATH: z
    .string()
    .optional()
    .transform((val) => val || join(homedir(), ".agents", "skills-manager-usage.json")),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

/** Validated application configuration. Fails fast if env vars are invalid. */
export const config = loadConfig(AppConfigSchema);

/**
 * Injection token for the application configuration.
 * @example
 * constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}
 */
export const APP_CONFIG = Symbol("APP_CONFIG");
