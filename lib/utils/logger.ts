/**
 * Environment-Aware Logger
 *
 * Architecture Decision:
 * Console output is wrapped to automatically suppress debug logs in production.
 * This prevents sensitive transaction data from appearing in user browsers
 * while keeping detailed logs available during development.
 *
 * Usage: logger.debug("ERA", "message", data)
 * - First param is always a prefix/module name for filtering
 * - Debug logs are silenced in production builds
 * - Error/warn logs always appear (important for monitoring)
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV !== "production";

function log(level: LogLevel, prefix: string, ...args: unknown[]) {
  if (!isDev && level === "debug") return;

  const timestamp = new Date().toISOString();
  const formattedPrefix = `[${timestamp}] [${prefix}]`;

  switch (level) {
    case "debug":
      console.log(formattedPrefix, ...args);
      break;
    case "info":
      console.info(formattedPrefix, ...args);
      break;
    case "warn":
      console.warn(formattedPrefix, ...args);
      break;
    case "error":
      console.error(formattedPrefix, ...args);
      break;
  }
}

export const logger = {
  debug: (prefix: string, ...args: unknown[]) => log("debug", prefix, ...args),
  info: (prefix: string, ...args: unknown[]) => log("info", prefix, ...args),
  warn: (prefix: string, ...args: unknown[]) => log("warn", prefix, ...args),
  error: (prefix: string, ...args: unknown[]) => log("error", prefix, ...args),
};
