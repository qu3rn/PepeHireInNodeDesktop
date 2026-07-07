import fs from "node:fs";
import path from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerContext {
  module: string;
  [key: string]: unknown;
}

export class AppLogger {
  private logPath: string;
  private readonly recentErrors: string[] = [];

  constructor(dataDir: string) {
    const logsDir = path.join(dataDir, "logs");
    fs.mkdirSync(logsDir, { recursive: true });
    this.logPath = path.join(logsDir, "app.log");
  }

  getLogPath(): string {
    return this.logPath;
  }

  getRecentErrors(): string[] {
    return [...this.recentErrors];
  }

  clearLogs(): void {
    try {
      fs.writeFileSync(this.logPath, "", "utf8");
      this.recentErrors.length = 0;
    } catch {
      // no-op
    }
  }

  debug(message: string, context: LoggerContext): void {
    this.write("debug", message, context);
  }

  info(message: string, context: LoggerContext): void {
    this.write("info", message, context);
  }

  warn(message: string, context: LoggerContext): void {
    this.write("warn", message, context);
  }

  error(message: string, context: LoggerContext): void {
    this.write("error", message, context);
  }

  private write(level: LogLevel, message: string, context: LoggerContext): void {
    const entry = {
      ts: new Date().toISOString(),
      level,
      message,
      context: this.redact(context)
    };

    const line = `${JSON.stringify(entry)}\n`;

    if (process.env.NODE_ENV === "development") {
      const method = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
      method(`[${context.module}] ${message}`, entry.context);
    }

    try {
      fs.appendFileSync(this.logPath, line, "utf8");
    } catch {
      // no-op
    }

    if (level === "error") {
      this.recentErrors.unshift(`${entry.ts}: ${message}`);
      if (this.recentErrors.length > 50) {
        this.recentErrors.pop();
      }
    }
  }

  private redact(value: unknown): unknown {
    const REDACT_KEYS = ["password", "token", "secret", "authorization", "cv", "coverLetter"];

    if (Array.isArray(value)) {
      return value.map((x) => this.redact(x));
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      if (REDACT_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = this.redact(inner);
      }
    }

    return result;
  }
}
