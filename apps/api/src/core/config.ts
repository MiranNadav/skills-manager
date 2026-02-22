import { config as dotenvConfig } from "dotenv";
import type { ZodType, ZodTypeDef, ZodError } from "zod";

export interface LoadConfigOptions {
  envPath?: string;
  loadDotenv?: boolean;
}

export class ConfigValidationError extends Error {
  public readonly issues: ZodError["issues"];

  constructor(zodError: ZodError) {
    const formatted = zodError.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    super(`Configuration validation failed:\n${formatted}`);
    this.name = "ConfigValidationError";
    this.issues = zodError.issues;
  }
}

export function loadConfig<T, Input = unknown>(
  schema: ZodType<T, ZodTypeDef, Input>,
  options: LoadConfigOptions = {},
): T {
  const { envPath, loadDotenv = true } = options;

  if (loadDotenv) {
    dotenvConfig({ path: envPath });
  }

  const result = schema.safeParse(process.env);

  if (!result.success) {
    throw new ConfigValidationError(result.error);
  }

  return result.data;
}
