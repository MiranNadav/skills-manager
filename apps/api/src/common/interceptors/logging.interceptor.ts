import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Injectable, Inject } from "@nestjs/common";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import type { Logger } from "../../core/logger.js";
import type { Request, Response } from "express";

/** Injection token for the application logger instance. */
export const APP_LOGGER = Symbol("APP_LOGGER");

/**
 * Logs HTTP request details and duration. Automatically includes
 * traceId from AsyncLocalStorage context (set by ContextInterceptor).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(APP_LOGGER) private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url } = request;
    const startTime = Date.now();

    this.logger.info("Incoming request", { method, url });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.info("Request completed", {
            method,
            url,
            statusCode: response.statusCode,
            duration,
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error("Request failed", {
            method,
            url,
            duration,
            error: error.message,
          });
        },
      }),
    );
  }
}
