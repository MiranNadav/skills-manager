import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  ValidationError,
  isOperationalError,
} from "./errors.js";

describe("AppError", () => {
  it("sets properties from constructor", () => {
    const err = new AppError("something broke", 500, "SERVER_ERROR");
    expect(err.message).toBe("something broke");
    expect(err.statusCode).toBe(500);
    expect(err.errorCode).toBe("SERVER_ERROR");
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it("isOperational defaults to true, can be overridden", () => {
    const err = new AppError("crash", 500, "CRASH", false);
    expect(err.isOperational).toBe(false);
  });

  it("toProblemDetails returns RFC 7807 shape", () => {
    const err = new AppError("bad input", 400, "BAD_INPUT");
    const pd = err.toProblemDetails("/skills/1");
    expect(pd.status).toBe(400);
    expect(pd.errorCode).toBe("BAD_INPUT");
    expect(pd.type).toBe("https://errors.internal/BAD_INPUT");
    expect(pd.instance).toBe("/skills/1");
  });

  it("toProblemDetails omits instance when not provided", () => {
    const err = new AppError("bad input", 400, "BAD_INPUT");
    const pd = err.toProblemDetails();
    expect(pd.instance).toBeUndefined();
  });
});

describe("NotFoundError", () => {
  it("builds message with id", () => {
    const err = new NotFoundError("Skill", "abc-123");
    expect(err.message).toContain("abc-123");
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe("NotFoundError");
  });

  it("builds message without id", () => {
    const err = new NotFoundError("Skill");
    expect(err.message).toContain("Skill");
    expect(err.message).not.toContain("undefined");
  });
});

describe("ValidationError", () => {
  it("sets validationErrors", () => {
    const errors = { name: ["required"] };
    const err = new ValidationError("invalid", errors);
    expect(err.statusCode).toBe(400);
    expect(err.validationErrors).toEqual(errors);
  });

  it("toProblemDetails includes validationErrors", () => {
    const err = new ValidationError("invalid", { name: ["required"] });
    const pd = err.toProblemDetails();
    expect(pd["validationErrors"]).toEqual({ name: ["required"] });
  });

  it("defaults validationErrors to empty object", () => {
    const err = new ValidationError("invalid");
    expect(err.validationErrors).toEqual({});
  });
});

describe("isOperationalError", () => {
  it("returns true for operational AppError subclass", () => {
    expect(isOperationalError(new NotFoundError("Skill"))).toBe(true);
  });

  it("returns false for non-operational AppError", () => {
    expect(isOperationalError(new AppError("crash", 500, "CRASH", false))).toBe(false);
  });

  it("returns false for plain Error", () => {
    expect(isOperationalError(new Error("oops"))).toBe(false);
  });

  it("returns false for non-error values", () => {
    expect(isOperationalError(null)).toBe(false);
    expect(isOperationalError("string")).toBe(false);
  });
});
