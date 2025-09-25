export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  functionName?: string;
  traceId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private level: LogLevel;
  private context: LogContext;

  constructor() {
    this.level = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
    this.context = {
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      requestId: process.env.AWS_REQUEST_ID,
    };
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  addContext(key: string, value: any): void {
    this.context[key] = value;
  }

  private log(
    level: LogLevel,
    message: string,
    additionalContext?: LogContext,
    error?: Error
  ): void {
    if (level < this.level) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context: { ...this.context, ...additionalContext },
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // In Lambda, use console.log for CloudWatch integration
    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Performance logging helpers
  startTimer(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration });
    };
  }

  // Security logging helpers
  securityEvent(event: string, context?: LogContext): void {
    this.warn(`SECURITY_EVENT: ${event}`, { ...context, securityEvent: true });
  }

  // Audit logging helpers
  auditEvent(event: string, context?: LogContext): void {
    this.info(`AUDIT_EVENT: ${event}`, { ...context, auditEvent: true });
  }

  // Business event logging
  businessEvent(event: string, context?: LogContext): void {
    this.info(`BUSINESS_EVENT: ${event}`, { ...context, businessEvent: true });
  }
}

// Singleton instance
export const logger = new Logger();

// Helper function to create child loggers with additional context
export function createChildLogger(context: LogContext): Logger {
  const childLogger = new Logger();
  childLogger.setContext(context);
  return childLogger;
}
