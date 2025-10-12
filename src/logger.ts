/**
 * Centralized logging system for consistent logging across the codebase
 *
 * Provides structured logging with multiple log levels, context tracking,
 * and configurable output formatting.
 *
 * Usage:
 *   Logger.info("Processing started", { count: 10 });
 *   Logger.error("Failed to process", error, { userId: "123" });
 *   Logger.setLevel(LogLevel.DEBUG);
 */

/**
 * Log levels in order of severity
 */
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Configuration for the Logger
 */
interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Whether to include timestamps in logs */
  includeTimestamp: boolean;
  /** Whether to include file/function context */
  includeContext: boolean;
  /** Maximum string length before truncation */
  maxStringLength: number;
}

/**
 * Centralized logging system
 *
 * Provides consistent, structured logging across the application with
 * configurable log levels, formatting, and context tracking.
 */
class Logger {
  private static config: LoggerConfig = {
    level: LogLevel.INFO,
    includeTimestamp: true,
    includeContext: true,
    maxStringLength: 1000,
  };

  /**
   * Sets the minimum log level
   *
   * @param level - The minimum log level to output
   *
   * @example
   * Logger.setLevel(LogLevel.DEBUG);
   */
  static setLevel(level: LogLevel): void {
    Logger.config.level = level;
  }

  /**
   * Gets the current log level
   *
   * @returns The current log level
   */
  static getLevel(): LogLevel {
    return Logger.config.level;
  }

  /**
   * Configures the logger
   *
   * @param config - Partial configuration to merge with defaults
   *
   * @example
   * Logger.configure({ includeTimestamp: false, maxStringLength: 500 });
   */
  static configure(config: Partial<LoggerConfig>): void {
    Logger.config = { ...Logger.config, ...config };
  }

  /**
   * Logs a debug message
   *
   * @param message - The log message
   * @param args - Additional arguments to log
   *
   * @example
   * Logger.debug("Processing item", { id: 123, name: "test" });
   */
  static debug(message: string, ...args: any[]): void {
    Logger.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Logs an info message
   *
   * @param message - The log message
   * @param args - Additional arguments to log
   *
   * @example
   * Logger.info("Config generated successfully", { fileCount: 10 });
   */
  static info(message: string, ...args: any[]): void {
    Logger.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Logs a warning message
   *
   * @param message - The log message
   * @param args - Additional arguments to log
   *
   * @example
   * Logger.warn("Missing optional field", { field: "description" });
   */
  static warn(message: string, ...args: any[]): void {
    Logger.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Logs an error message
   *
   * @param message - The log message
   * @param error - Optional error object
   * @param args - Additional arguments to log
   *
   * @example
   * Logger.error("Failed to process", error, { userId: "123" });
   */
  static error(message: string, error?: Error | any, ...args: any[]): void {
    const allArgs = error ? [error, ...args] : args;
    Logger.log(LogLevel.ERROR, message, ...allArgs);
  }

  /**
   * Internal logging implementation
   *
   * @param level - The log level
   * @param message - The log message
   * @param args - Additional arguments to log
   */
  private static log(level: LogLevel, message: string, ...args: any[]): void {
    // Skip if below configured level
    if (level < Logger.config.level) {
      return;
    }

    const levelName = LogLevel[level];
    const parts: string[] = [];

    // Add timestamp
    if (Logger.config.includeTimestamp) {
      parts.push(`[${Logger.getTimestamp()}]`);
    }

    // Add level
    parts.push(`[${levelName}]`);

    // Add message
    parts.push(message);

    // Format the log entry
    let logEntry = parts.join(" ");

    // Add additional arguments if present
    if (args.length > 0) {
      const formattedArgs = args
        .map((arg) => Logger.formatArgument(arg))
        .filter((arg) => arg !== null)
        .join(" ");

      if (formattedArgs) {
        logEntry += ` ${formattedArgs}`;
      }
    }

    // Output to console
    Logger.output(level, logEntry);
  }

  /**
   * Formats a single argument for logging
   *
   * @param arg - The argument to format
   * @returns Formatted string or null if empty
   */
  private static formatArgument(arg: any): string | null {
    if (arg === null || arg === undefined) {
      return null;
    }

    try {
      // Handle Error objects specially
      if (arg instanceof Error) {
        return `Error: ${arg.message}${arg.stack ? `\nStack: ${arg.stack}` : ""}`;
      }

      // Handle objects and arrays
      if (typeof arg === "object") {
        const json = JSON.stringify(arg, null, 2);
        return Logger.truncate(json);
      }

      // Handle primitives
      const str = String(arg);
      return Logger.truncate(str);
    } catch (error) {
      return `[Unserializable: ${typeof arg}]`;
    }
  }

  /**
   * Truncates a string if it exceeds max length
   *
   * @param str - The string to truncate
   * @returns Truncated string
   */
  private static truncate(str: string): string {
    if (str.length <= Logger.config.maxStringLength) {
      return str;
    }

    const truncated = str.substring(0, Logger.config.maxStringLength);
    return `${truncated}... [truncated ${str.length - Logger.config.maxStringLength} chars]`;
  }

  /**
   * Gets formatted timestamp
   *
   * @returns ISO timestamp string
   */
  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Outputs log to console with appropriate method
   *
   * @param level - The log level
   * @param message - The formatted log message
   */
  private static output(level: LogLevel, message: string): void {
    switch (level) {
      case LogLevel.DEBUG:
        console.log(message);
        break;
      case LogLevel.INFO:
        console.log(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  }

  /**
   * Creates a scoped logger for a specific module/context
   *
   * @param context - The context name (e.g., "IconProcessor", "DriveService")
   * @returns Object with logging methods that include context
   *
   * @example
   * const log = Logger.scope("IconProcessor");
   * log.info("Processing icon", { name: "tree" });
   * // Output: [2024-01-01T00:00:00.000Z] [INFO] [IconProcessor] Processing icon {"name":"tree"}
   */
  static scope(context: string): {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, error?: Error | any, ...args: any[]) => void;
  } {
    return {
      debug: (message: string, ...args: any[]) =>
        Logger.debug(`[${context}] ${message}`, ...args),
      info: (message: string, ...args: any[]) =>
        Logger.info(`[${context}] ${message}`, ...args),
      warn: (message: string, ...args: any[]) =>
        Logger.warn(`[${context}] ${message}`, ...args),
      error: (message: string, error?: Error | any, ...args: any[]) =>
        Logger.error(`[${context}] ${message}`, error, ...args),
    };
  }

  /**
   * Logs performance timing information
   *
   * @param operation - The operation being timed
   * @param startTime - Start time in milliseconds
   *
   * @example
   * const start = Date.now();
   * // ... operation ...
   * Logger.timing("processIcons", start);
   * // Output: [INFO] Operation 'processIcons' took 1234ms
   */
  static timing(operation: string, startTime: number): void {
    const duration = Date.now() - startTime;
    Logger.info(`Operation '${operation}' took ${duration}ms`);
  }

  /**
   * Groups related log messages
   *
   * @param label - The group label
   * @param callback - Function to execute within the group
   *
   * @example
   * Logger.group("Processing Categories", () => {
   *   Logger.info("Loading data");
   *   Logger.info("Validating");
   *   Logger.info("Complete");
   * });
   */
  static group(label: string, callback: () => void): void {
    Logger.info(`╔══ ${label} ══`);
    try {
      callback();
    } finally {
      Logger.info(`╚══ End ${label} ══`);
    }
  }
}

/**
 * Export LogLevel enum for external use
 */
// Note: In Apps Script global scope, this is accessed as LogLevel
// No explicit export needed, but keep for TypeScript type checking
