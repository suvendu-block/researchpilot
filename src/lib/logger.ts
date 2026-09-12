import pino from "pino";

// pino is fast and structured — way better than console.log for production
// logs are JSON by default, which is great for log aggregators

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // in dev, pretty-print so it's readable; in prod, raw JSON for machines
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

// create a child logger with a module name — makes it easy to filter logs
// e.g., logger.child({ module: "agent" }) adds "module":"agent" to every log line
export function createChildLogger(name: string) {
  return logger.child({ module: name });
}
