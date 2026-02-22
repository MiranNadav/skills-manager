export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errorCode: string;
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toProblemDetails(instance?: string): ProblemDetails {
    return {
      type: `https://errors.internal/${this.errorCode}`,
      title: this.name,
      status: this.statusCode,
      detail: this.message,
      errorCode: this.errorCode,
      ...(instance ? { instance } : {}),
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const detail = id
      ? `${resource} with id '${id}' was not found`
      : `${resource} was not found`;
    super(detail, 404, "RESOURCE_NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  public readonly validationErrors: Record<string, string[]>;

  constructor(message: string, validationErrors: Record<string, string[]> = {}) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.validationErrors = validationErrors;
  }

  override toProblemDetails(instance?: string): ProblemDetails {
    return {
      ...super.toProblemDetails(instance),
      validationErrors: this.validationErrors,
    };
  }
}

export function isOperationalError(error: unknown): error is AppError {
  return error instanceof AppError && error.isOperational;
}
