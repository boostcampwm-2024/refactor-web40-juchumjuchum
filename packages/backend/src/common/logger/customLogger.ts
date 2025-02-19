import { Inject, Injectable } from '@nestjs/common';
import { ConnectionMonitorService } from './connectionMonitor.service';
import { Logger } from 'winston';

type LogLevel = 'error' | 'warn' | 'info';

@Injectable()
export class CustomLogger {
  constructor(
    private readonly connectionMonitorService: ConnectionMonitorService,
    @Inject('winston') private readonly logger: Logger,
  ) {}

  private log(
    level: LogLevel,
    message: string | unknown,
    errorOrContext?: string | unknown,
    context?: string,
  ) {
    const connectionInfo = this.connectionMonitorService.getConnectionPoolInfo();

    if (typeof message === 'string') {
      this.logWithMessage(connectionInfo, level, message, errorOrContext, context);
      return;
    }

    if (message instanceof Error) {
      this.logWithError(connectionInfo, level, message, errorOrContext);
      return;
    }
  }

  private logWithError(
    connectionInfo: string,
    level: LogLevel,
    error: Error,
    errorOrContext?: string | unknown,
  ) {
    if (typeof errorOrContext === 'string' || typeof errorOrContext === 'undefined') {
      this.logger.log(level, {
        message: error.message,
        stack: error.stack,
        context: errorOrContext,
        connectionInfo,
      });
    }
  }

  private logWithMessage(
    connectionInfo: string,
    level: LogLevel,
    message: string,
    errorOrContext?: string | unknown,
    context?: string,
  ) {
    if (typeof errorOrContext === 'string' || typeof errorOrContext === 'undefined') {
      this.logger.log(level, message, {
        context: errorOrContext,
        connectionInfo,
      });
      return;
    }

    if (errorOrContext instanceof Error) {
      this.logWithMessageAndError(connectionInfo, level, message, errorOrContext, context);
    }
  }

  private logWithMessageAndError(
    connectionInfo: string,
    level: LogLevel,
    message: string,
    error: Error,
    context?: string,
  ) {
    this.logger.log(level, message, {
      message: error.message,
      stack: error.stack,
      context,
      connectionInfo,
    });
  }

  info(message: string, context?: string) {
    this.log('info', message, context);
  }

  warn(message: string | unknown, errorOrContext?: string | unknown, context?: string) {
    this.log('warn', message, errorOrContext, context);
  }

  error(message: string | unknown, errorOrContext?: string | unknown, context?: string) {
    this.log('error', message, errorOrContext, context);
  }
}
