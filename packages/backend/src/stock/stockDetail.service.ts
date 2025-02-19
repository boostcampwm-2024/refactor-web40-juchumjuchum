import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StockDetail } from './domain/stockDetail.entity';
import { StockDetailResponse } from './dto/stockDetail.response';
import { CustomLogger } from '@/common/logger/customLogger';

@Injectable()
export class StockDetailService {
  private readonly context = 'StockDetailService';

  constructor(
    private readonly datasource: DataSource,
    private readonly customLogger: CustomLogger,
  ) {}

  async getStockDetailByStockId(stockId: string): Promise<StockDetailResponse> {
    return await this.datasource.transaction(async (manager) => {
      this.customLogger.info(`get stock detail by stockId: ${stockId}`, this.context);
      const isExists = await manager.existsBy(StockDetail, {
        stock: { id: stockId },
      });

      if (!isExists) {
        this.customLogger.warn(`stock detail not found for stock: ${stockId}`, this.context);
        throw new NotFoundException(
          `stock detail not found (stockId: ${stockId}`,
        );
      }

      const result = await manager
        .getRepository(StockDetail)
        .createQueryBuilder('stockDetail')
        .leftJoinAndSelect('stockDetail.stock', 'stock')
        .where('stockDetail.stock_id = :stockId', { stockId })
        .getOne();

      if (!result) {
        throw new NotFoundException(
          `stock detail not found (stockId: ${stockId}`,
        );
      }

      return new StockDetailResponse(result);
    });
  }
}
