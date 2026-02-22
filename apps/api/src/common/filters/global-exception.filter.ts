import type { ExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { Catch, HttpException, HttpStatus, Inject } from "@nestjs/common";
import type { Response, Request } from "express";
import type { Logger } from "../../core/logger.js";
import { isOperationalError } from "../../core/errors.js";
import type { AppError } from "../../core/errors.js";
import { APP_LOGGER } from "../interceptors/logging.interceptor.js";

/**
 * Global exception filter converting errors into RFC 7807 Problem
 * Details responses. Three tiers:
 * 1. Operational errors (AppError) → toProblemDetails() at correct status
 * 2. NestJS HttpExceptions → formatted at NestJS status
 * 3. Unknown errors → fatal log, generic 500
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(@Inject(APP_LOGGER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (isOperationalError(exception)) {
      const appError = exception as AppError;
      this.logger.warn("Operational error", {
        errorCode: appError.errorCode,
        statusCode: appError.statusCode,
        path: request.path,
      });
      response
        .status(appError.statusCode)
        .json(appError.toProblemDetails(request.path));
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      this.logger.warn("HTTP exception", {
        statusCode: status,
        path: request.path,
        message: exception.message,
      });

      response.status(status).json({
        type: "about:blank",
        title: exception.name,
        status,
        detail: exception.message,
        instance: request.path,
        ...(typeof exceptionResponse === "object" ? exceptionResponse : {}),
      });
      return;
    }

    this.logger.fatal("Unexpected error", {
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
      path: request.path,
    });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      type: "about:blank",
      title: "Internal Server Error",
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: "An unexpected error occurred",
      instance: request.path,
    });
  }
}
