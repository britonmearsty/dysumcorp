/**
 * Safe logger that only logs in development
 * Prevents information leakage in production
 */
const isDev = process.env.NODE_ENV === "development";

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Always log errors, but sanitize in production
    if (isDev) {
      console.error(...args);
    } else {
      // In production, only log generic error without sensitive details
      const sanitized = args.map((arg) =>
        typeof arg === "string" ? "[Error logged]" : arg,
      );
      console.error(...sanitized);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
};
