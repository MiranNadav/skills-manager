import type { LoggerService } from "@nestjs/common";
import type { Logger as CoreLogger } from "../../core/logger.js";

/**
 * Bridges NestJS's LoggerService to @internal/core Logger so all
 * framework logs use our standardized format with redaction and traceId.
 */
export class NestJSLoggerAdapter implements LoggerService {
  constructor(private readonly logger: CoreLogger) {}

  log(message: string, context?: string): void {
    this.logger.info(message, context ? { context } : undefined);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, {
      ...(context ? { context } : {}),
      ...(trace ? { trace } : {}),
    });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context ? { context } : undefined);
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, context ? { context } : undefined);
  }

  verbose(message: string, context?: string): void {
    this.logger.trace(message, context ? { context } : undefined);
  }
}
