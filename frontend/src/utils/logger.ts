/**
 * Production-safe Logger
 * Automatically disables console logs in production
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  timestamp?: boolean;
}

class Logger {
  private prefix: string;
  private timestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || 'ChainMind';
    this.timestamp = options.timestamp !== false;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = this.timestamp ? new Date().toISOString() : '';
    const prefix = `[${this.prefix}]`;
    const levelTag = `[${level.toUpperCase()}]`;
    
    return `${timestamp} ${prefix} ${levelTag} ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (isDevelopment) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (isDevelopment) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('warn', message), ...args);
  }

  error(message: string, error?: any): void {
    console.error(this.formatMessage('error', message), error);
    
    // In production, send to error tracking service
    if (!isDevelopment && typeof window !== 'undefined') {
      // Check if Sentry is available (add Sentry SDK to use this)
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { context: message },
          level: 'error'
        });
      }
      // Fallback: Send to custom error endpoint if needed
      // fetch('/api/errors', { method: 'POST', body: JSON.stringify({ message, error }) });
    }
  }

  success(message: string, ...args: any[]): void {
    if (isDevelopment) {
      console.log(this.formatMessage('info', `✅ ${message}`), ...args);
    }
  }

  group(label: string, callback: () => void): void {
    if (isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  table(data: any): void {
    if (isDevelopment && console.table) {
      console.table(data);
    }
  }

  time(label: string): void {
    if (isDevelopment && console.time) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (isDevelopment && console.timeEnd) {
      console.timeEnd(label);
    }
  }
}

// Create default logger instance
export const logger = new Logger();

// Create specialized loggers for different modules
export const createLogger = (prefix: string): Logger => {
  return new Logger({ prefix });
};

// Export for specific use cases
export const websocketLogger = createLogger('WebSocket');
export const apiLogger = createLogger('API');
export const portfolioLogger = createLogger('Portfolio');
export const chatLogger = createLogger('Chat');

export default logger;
