import { Global, Module } from '@nestjs/common';
import { CustomLogger } from './customLogger';
import { WinstonModule } from 'nest-winston';
import { logger } from '@/configs/logger.config';
import { ConnectionMonitorService } from './connectionMonitor.service';

@Global()
@Module({
  imports: [WinstonModule.forRoot(logger)],
  providers: [CustomLogger, ConnectionMonitorService],
  exports: [CustomLogger],
})
export class CustomLoggerModule {}
