import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ConnectionMonitorService {
  constructor(private readonly datasource: DataSource) {}

  getConnectionPoolInfo() {
    const pool = (this.datasource.driver as any).pool;
    if (!pool) {
      return '';
    }

    const status = {
      total: pool._allConnections.length,
      free: pool._freeConnections.length,
      pending: pool._connectionQueue.length,
    };

    return `[Connections]: ${JSON.stringify(status)}`;
  }
}
