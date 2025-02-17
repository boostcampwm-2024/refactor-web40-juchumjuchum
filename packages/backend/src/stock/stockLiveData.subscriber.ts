import { Injectable } from '@nestjs/common';
import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  InsertEvent,
  DataSource,
} from 'typeorm';
import { StockLiveData } from './domain/stockLiveData.entity';
import { StockGateway } from './stock.gateway';
import { CustomLogger } from '@/common/logger/customLogger';

@Injectable()
@EventSubscriber()
export class StockLiveDataSubscriber
  implements EntitySubscriberInterface<StockLiveData>
{
  private readonly context = 'StockLiveDataSubscriber';
  
  constructor(
    private readonly datasource: DataSource,
    private readonly stockGateway: StockGateway,
    private readonly customLogger: CustomLogger,
  ) {
    this.datasource.subscribers.push(this);
  }

  listenTo() {
    return StockLiveData;
  }

  async afterInsert(event: InsertEvent<StockLiveData>) {
    try {
      const entity = event.entity;
      const { id: stockId } = entity.stock;
      const {
        currentPrice: price,
        changeRate: change,
        volume: volume,
      } = entity;

      this.customLogger.info(`after insert for stock: ${stockId}`, this.context);
      this.stockGateway.onUpdateStock(stockId, price, change, volume);
    } catch (error) {
      this.customLogger.warn(
        `Failed to handle stock live data afterInsert event: ${error}`, this.context
      );
    }
  }

  async afterUpdate(event: UpdateEvent<StockLiveData>) {
    try {
      const updatedStockLiveData =
        event.entity || (await this.loadUpdatedData(event));

      if (updatedStockLiveData?.stock?.id) {
        const { id: stockId } = updatedStockLiveData.stock;
        const {
          currentPrice: price,
          changeRate: change,
          volume: volume,
        } = updatedStockLiveData;

        this.customLogger.info(`after update for stock: ${stockId}`, this.context);
        this.stockGateway.onUpdateStock(stockId, price, change, volume);
      } else {
        this.customLogger.warn(
          `Stock ID missing for updated data: ${updatedStockLiveData?.id}`, this.context
        );
      }
    } catch (error) {
      this.customLogger.warn(
        `Failed to handle stock live data afterUpdate event: ${error}`, this.context
      );
    }
  }

  private async loadUpdatedData(event: UpdateEvent<StockLiveData>) {
    this.customLogger.info(`load updated data for stock: ${event.databaseEntity.id}`, this.context);
    return event.manager.findOne(StockLiveData, {
      where: { id: event.databaseEntity.id },
    });
  }
}
