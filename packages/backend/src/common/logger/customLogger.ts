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

  private log(level: LogLevel, message: string | unknown, errorOrContext?: string | unknown, context?: string) {
    const connectionInfo = this.connectionMonitorService.getConnectionPoolInfo();

    if (typeof errorOrContext === 'string') {
      this.logWithContext(connectionInfo, level, message, errorOrContext);
      return;
    }

    if (errorOrContext instanceof Error) {
      if (typeof message !== 'string') return;
      this.logWithErrorAndMessage(connectionInfo, level, message, errorOrContext, context);
    }
  }

  private logWithContext(connectionInfo: string, level: LogLevel, message: string | unknown, context: string) {
    if (message instanceof Error) {
      this.logger.log(level, {
        message: message.message,
        stack: message.stack,
        context,
        connectionInfo,
      });
      return;
    }

    if (typeof message === 'string') {
      this.logger.log(level, message, {
        context,
        connectionInfo,
      });
    }
  }

  private logWithErrorAndMessage(connectionInfo: string, level: LogLevel, message: string, error: Error, context?: string) {
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

  warn(message: string, context?: string) {
    this.log('warn', message, context);
  }

  error(message: string | unknown, errorOrContext?: string | unknown, context?: string) {
    this.log('error', message, errorOrContext, context);
  }
}
