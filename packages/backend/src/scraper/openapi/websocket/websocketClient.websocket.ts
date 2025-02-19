import { CustomLogger } from '@/common/logger/customLogger';
import { Injectable } from '@nestjs/common';
import { RawData, WebSocket } from 'ws';
@Injectable()
export class WebsocketClient {
  static url = process.env.WS_URL ?? 'ws://ops.koreainvestment.com:21000';
  private readonly context = 'WebsocketClient';
  private client: WebSocket;
  private messageQueue: string[] = [];

  constructor(private readonly customLogger: CustomLogger) {
    this.client = new WebSocket(WebsocketClient.url);
    this.initOpen(() => this.flushQueue());
    this.initError((error) => this.customLogger.error('WebSocket error', error, this.context));
  }

  static websocketFactory(customLogger: CustomLogger) {
    return new WebsocketClient(customLogger);
  }

  subscribe(message: string) {
    this.sendMessage(message);
  }
  unsubscribe(message: string) {
    this.sendMessage(message);
  }
  private initOpen(fn: () => void) {
    this.client.on('open', fn);
  }
  private initMessage(fn: (data: RawData) => void) {
    this.client.on('message', fn);
  }
  private initDisconnect(initCloseCallback: () => void) {
    this.client.on('close', initCloseCallback);
  }
  private initError(initErrorCallback: (error: unknown) => void) {
    this.client.on('error', initErrorCallback);
  }
  connectFacade(
    initOpenCallback: (fn: (message: string) => void) => () => void,
    initMessageCallback: (client: WebSocket) => (data: RawData) => void,
    initCloseCallback: () => void,
    initErrorCallback: (error: unknown) => void,
  ) {
    this.initOpen(initOpenCallback(this.sendMessage.bind(this)));
    this.initMessage(initMessageCallback(this.client));
    this.initDisconnect(initCloseCallback);
    this.initError(initErrorCallback);
  }

  private sendMessage(message: string) {
    this.customLogger.info(`Trying to send message: ${message}`, this.context);
    if (this.client.readyState === WebSocket.OPEN) {
      this.client.send(message);
      this.customLogger.info(`Sent message: ${message}`, this.context);
    } else {
      this.customLogger.warn('WebSocket not open. Queueing message.', this.context);
      this.messageQueue.push(message); // 큐에 메시지를 추가
    }
  }

  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }
}
