import { Injectable } from '@nestjs/common';
import { OpenapiTokenApi } from '@/scraper/openapi/api/openapiToken.api';
import { TR_ID } from '@/scraper/openapi/type/openapiUtil.type';
import { getOpenApi } from '@/scraper/openapi/util/openapiUtil.api';
import { PriorityQueue } from '@/scraper/openapi/util/priorityQueue';
import { CustomLogger } from '@/common/logger/customLogger';

export interface Json {
  output: Record<string, string> | Record<string, string>[];
  output1: Record<string, string>[];
  output2: Record<string, string>[];
}

export interface OpenapiQueueNodeValue {
  url: string;
  query: object;
  trId: TR_ID;
  callback: <T extends Json>(value: T) => Promise<void>;
  count?: number;
}

@Injectable()
export class OpenapiQueue {
  private queue: PriorityQueue<OpenapiQueueNodeValue> = new PriorityQueue();
  constructor() {}

  // TODO: value.count의 기본값이 5인 상태인데, 현재 등록된 API KEY가 1개이기 때문에 문제가 발생할 수 있음
  enqueue(value: OpenapiQueueNodeValue, priority?: number) {
    if (!priority) priority = 2;
    if (value.count === undefined) value.count = 5;
    this.queue.enqueue(value, priority);
  }

  dequeue(): OpenapiQueueNodeValue | undefined {
    return this.queue.dequeue();
  }

  isEmpty(): boolean {
    return this.queue.isEmpty();
  }
}

@Injectable()
export class OpenapiConsumer {
  private readonly REQUEST_COUNT_PER_SECOND = 20;
  private readonly context = 'OpenapiConsumer';
  private isProcessing: boolean = false;
  private currentTokenIndex = 0;

  constructor(
    private readonly queue: OpenapiQueue,
    private readonly openapiTokenApi: OpenapiTokenApi,
    private readonly customLogger: CustomLogger,
  ) {
    this.start();
  }

  async start() {
    setInterval(() => this.consume(), 1000);
  }

  async consume() {
    if (this.isProcessing) {
      return;
    }

    while (!this.queue.isEmpty()) {
      this.isProcessing = true;
      await this.processQueueRequest();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    this.isProcessing = false;
  }

  private async processQueueRequest() {
    const tokenCount = (await this.openapiTokenApi.configs()).length;
    for (let i = 0; i < tokenCount; i++) {
      await this.processIndividualTokenRequest(this.currentTokenIndex);
      if (!this.isProcessing) {
        return;
      }
      this.currentTokenIndex = (this.currentTokenIndex + 1) % tokenCount;
    }
  }

  private async processIndividualTokenRequest(index: number) {
    for (let i = 0; i < this.REQUEST_COUNT_PER_SECOND; i++) {
      const node = this.queue.dequeue();
      if (!node) {
        return;
      }
      this.processRequest(node, index);
    }
  }

  private async processRequest(node: OpenapiQueueNodeValue, index: number) {
    try {
      const data = await getOpenApi(
        node.url,
        (await this.openapiTokenApi.configs())[index],
        node.query,
        node.trId,
      );
      await node.callback(data);
    } catch (error) {
      this.customLogger.warn('OpenAPI process request failed', this.context);
      if (node.count === undefined || node.count! <= 0) {
        this.customLogger.error(`OpenAPI queue error - URL:${node.url}, trId: ${node.trId}`, this.context);
        this.customLogger.error('Error details', error, this.context);
        return;
      }
      this.customLogger.warn(`OpenAPI queue warning - URL:${node.url}, trId: ${node.trId}`, error, this.context);
      this.customLogger.warn('Warning details', error, this.context);
      this.customLogger.warn(`Retries left: ${node.count - 1}`, this.context);
      node.count -= 1;
      this.queue.enqueue(node, 1);
    }
  }
}
