import { appConfig } from '#config/app.config.js';

/**
 * Simple logger utility for the Auth Service
 * In production, consider using Winston or Pino for advanced logging
 */
class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
    this.currentLevel = this.levels[appConfig.logging.level] || this.levels.info;
  }

  /**
   * Format log message
   */
  format(level, message, meta = {}) {
    // Simple timestamp format: YYYY-MM-DD HH:MM:SS
    const now = new Date();
    const timestamp = now.toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');

    // Pretty format with indented JSON for better readability
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      // Format JSON with 2-space indentation for readability
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    
    return `${timestamp} | ${appConfig.serviceName} | ${message}${metaStr}`;
  }

  /**
   * Log error
   */
  error(message, meta = {}) {
    if (this.currentLevel >= this.levels.error) {
      if (meta instanceof Error) {
        meta = {
          error: meta.message,
          stack: meta.stack,
        };
      }
      console.error(this.format('error', message, meta));
    }
  }

  /**
   * Log warning
   */
  warn(message, meta = {}) {
    if (this.currentLevel >= this.levels.warn) {
      console.warn(this.format('warn', message, meta));
    }
  }

  /**
   * Log info
   */
  info(message, meta = {}) {
    if (this.currentLevel >= this.levels.info) {
      console.log(this.format('info', message, meta));
    }
  }

  /**
   * Log debug
   */
  debug(message, meta = {}) {
    if (this.currentLevel >= this.levels.debug) {
      console.debug(this.format('debug', message, meta));
    }
  }

  /**
   * Log HTTP request
   */
  http(req, res, duration) {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      this.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      this.warn('HTTP Request', logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }
}

export const logger = new Logger();
