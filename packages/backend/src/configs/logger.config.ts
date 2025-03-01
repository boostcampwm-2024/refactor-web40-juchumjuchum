import { createLogger, format, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf } = format;

const logFormat = printf(
  ({ level, message, timestamp, context, connectionInfo }) => {
    return `[${timestamp}][${level}]${context ? `[${context}]` : ''}: ${message} ${connectionInfo ?? ''}`;
  },
);

export const logger = createLogger({
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), logFormat),
  transports: [
    new DailyRotateFile({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      filename: `logFile-error.log`,
      dirname: '../logs',
      maxFiles: '7d',
      maxSize: '10m',
    }),
    new DailyRotateFile({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      filename: `logFile.log`,
      dirname: '../logs',
      maxFiles: '7d',
      maxSize: '10m',
    }),
    new DailyRotateFile({
      level: 'warn',
      datePattern: 'YYYY-MM-DD',
      filename: `logFile-warn.log`,
      dirname: '../logs',
      maxFiles: '7d',
      maxSize: '10m',
    }),

    // Console transport 추가
    new transports.Console({
      format: combine(format.colorize(), logFormat),
    }),
  ],
});
