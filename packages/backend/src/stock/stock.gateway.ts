import { Inject, Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Mutex } from 'async-mutex';
import { Server, Socket } from 'socket.io';
import { Logger } from 'winston';
import { LiveData } from '@/scraper/openapi/liveData.service';

@WebSocketGateway({
  namespace: '/api/stock/realtime',
  pingInterval: 5000,
  pingTimeout: 5000,
})
@Injectable()
export class StockGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly mutex = new Mutex();
  private readonly context = 'StockGateway';
  private readonly users: Map<string, string> = new Map();
  private readonly updateQueue =
    new Map<string, {
    timer: NodeJS.Timeout;
    lastUpdate: {
      price: number;
      change: number;
      volume: number;
    };
  }>();

  private readonly THROTTLE_TIME = 1000; // 5초

  constructor(
    private readonly liveData: LiveData,
    @Inject('winston') private readonly logger: Logger,
  ) {}

  private async handleJoinToRoom(stockId: string) {
    const connectedSockets = await this.server.to(stockId).fetchSockets();

    if (connectedSockets.length > 0 && !this.liveData.isSubscribe(stockId)) {
      await this.liveData.subscribe(stockId);
      this.logger.info(`${stockId} is subscribed`);
    }
  }

  @SubscribeMessage('connectStock')
  async handleConnectStock(
    @MessageBody() stockId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      client.join(stockId);

      await this.mutex.runExclusive(async () => {
        const beforeStockId = this.users.get(client.id);
        await this.handleClientStockEvent(beforeStockId, client);

        this.users.set(client.id, stockId);
        this.handleJoinToRoom(stockId);
      });

      client.emit('connectionSuccess', {
        message: `Successfully connected to stock room: ${stockId}`,
        stockId,
      });
    } catch (e) {
      const error = e as Error;
      this.logger.warn(error.message);
      client.emit('error', error.message);
      client.disconnect();
    }
  }

  private async handleClientStockEvent(
    stockId: string | undefined,
    client: Socket,
  ) {
    if (stockId !== undefined) {
      client.leave(stockId);
      this.users.delete(client.id);
      const values = Object.values(this.users);
      const isStockIdExists = values.some((value) => stockId === value);
      if (!isStockIdExists) {
        await this.liveData.unsubscribe(stockId);
      }
    }
  }

  async handleDisconnect(client: Socket) {
    const stockId = this.users.get(client.id);
    await this.mutex.runExclusive(async () => {
      await this.handleClientStockEvent(stockId, client);
    });
  }

  onUpdateStock(
    stockId: string,
    price: number,
    change: number,
    volume: number,
  ) {
    const existing = this.updateQueue.get(stockId);

    if (existing) {
      // 이미 대기중인 업데이트가 있다면 값만 갱신
      existing.lastUpdate = { price, change, volume };
      return;
    }

    // 첫 업데이트는 즉시 전송
    this.emitStockUpdate(stockId, price, change, volume);

    // 이후 업데이트는 스로틀링 적용
    const timer = setInterval(() => {
      const queuedUpdate = this.updateQueue.get(stockId);
      if (queuedUpdate) {
        const { price, change, volume } = queuedUpdate.lastUpdate;
        this.emitStockUpdate(stockId, price, change, volume);
      }
    }, this.THROTTLE_TIME);

    this.updateQueue.set(stockId, {
      timer,
      lastUpdate: { price, change, volume }
    });
  }

  private emitStockUpdate(
    stockId: string,
    price: number,
    change: number,
    volume: number,
  ) {
    this.logger.info(
      `Update stock ${stockId} with price: ${price}`,
      { context: this.context }
    );
    this.server.to(stockId).emit('updateStock', { price, change, volume });
  }
}
