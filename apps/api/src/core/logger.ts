import { AsyncLocalStorage } from "node:async_hooks";
import { v4 as uuidv4 } from "uuid";

export interface LogContext {
  traceId: string;
  [key: string]: unknown;
}

export const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

export function getLogContext(): LogContext | undefined {
  return asyncLocalStorage.getStore();
}

export function runWithContext<T>(
  fn: () => T,
  context?: Partial<LogContext>,
): T {
  const ctx: LogContext = {
    traceId: context?.traceId ?? uuidv4(),
    ...context,
  };
  return asyncLocalStorage.run(ctx, fn);
}

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LoggerOptions {
  serviceName: string;
  level?: LogLevel;
}

const LEVELS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

export class Logger {
  private readonly serviceName: string;
  private readonly minLevel: number;
  private readonly bindings: Record<string, unknown>;

  constructor(options: LoggerOptions, bindings: Record<string, unknown> = {}) {
    this.serviceName = options.serviceName;
    this.minLevel = LEVELS[options.level ?? "info"];
    this.bindings = bindings;
  }

  child(extra: Record<string, unknown>): Logger {
    const child = Object.create(Logger.prototype) as Logger;
    Object.assign(child, {
      serviceName: this.serviceName,
      minLevel: this.minLevel,
      bindings: { ...this.bindings, ...extra },
    });
    return child;
  }

  trace(msg: string, data?: Record<string, unknown>): void {
    this.log("trace", msg, data);
  }
  debug(msg: string, data?: Record<string, unknown>): void {
    this.log("debug", msg, data);
  }
  info(msg: string, data?: Record<string, unknown>): void {
    this.log("info", msg, data);
  }
  warn(msg: string, data?: Record<string, unknown>): void {
    this.log("warn", msg, data);
  }
  error(msg: string, data?: Record<string, unknown>): void {
    this.log("error", msg, data);
  }
  fatal(msg: string, data?: Record<string, unknown>): void {
    this.log("fatal", msg, data);
  }

  private log(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
    if (LEVELS[level] < this.minLevel) return;

    const ctx = getLogContext();
    const entry = {
      time: new Date().toISOString(),
      level,
      service: this.serviceName,
      ...(ctx ? { traceId: ctx.traceId } : {}),
      ...this.bindings,
      ...data,
      msg,
    };

    const output = JSON.stringify(entry);
    if (level === "error" || level === "fatal") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }
}
