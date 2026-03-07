// Centralized logging utility (ISO 27001 A.8.15)
// Provides structured logging with different levels

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function getMinLogLevel(): LogLevel {
  const env = process.env.NODE_ENV || 'development'
  return env === 'production' ? 'info' : 'debug'
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel()
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
}

function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, message, context } = entry
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
}

function createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  }
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return

  const entry = createLogEntry(level, message, context)
  const formatted = formatLogEntry(entry)

  switch (level) {
    case 'debug':
      console.debug(formatted)
      break
    case 'info':
      console.info(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'error':
      console.error(formatted)
      break
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),

  request: (method: string, path: string, context?: LogContext) => {
    log('info', `${method} ${path}`, context)
  },

  response: (method: string, path: string, status: number, duration?: number) => {
    log('info', `${method} ${path} -> ${status}`, duration ? { durationMs: duration } : undefined)
  },

  errorWithStack: (message: string, error: unknown, context?: LogContext) => {
    const errorContext: LogContext = { ...context }

    if (error instanceof Error) {
      errorContext.errorMessage = error.message
      errorContext.stack = error.stack
    } else {
      errorContext.error = String(error)
    }

    log('error', message, errorContext)
  },
}

export default logger
