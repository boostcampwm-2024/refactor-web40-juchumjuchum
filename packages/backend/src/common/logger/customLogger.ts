import { Inject, Injectable } from '@nestjs/common';
import { ConnectionMonitorService } from './connectionMonitor.service';
import { Logger } from 'winston';

@Injectable()
export class CustomLogger {
  constructor(
    private readonly connectionMonitorService: ConnectionMonitorService,
    @Inject('winston') private readonly logger: Logger,
  ) {}

  log(level: string, message: string, context?: string) {
    this.logger.log(level, message, {
      context,
      connectionInfo: this.connectionMonitorService.getConnectionPoolInfo(),
    });
  }

  info(message: string, context?: string) {
    this.log('info', message, context);
  }

  warn(message: string, context?: string) {
    this.log('warn', message, context);
  }

  error(message: string, context: string) {
    this.log('error', message, context);
  }
}
