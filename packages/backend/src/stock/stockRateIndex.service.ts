import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StockLiveData } from './domain/stockLiveData.entity';
import { StockIndexRateResponse } from './dto/stockIndexRate.response';
import { IndexRateGroupCode } from '@/scraper/openapi/type/openapiIndex.type';
import { CustomLogger } from '@/common/logger/customLogger';

@Injectable()
export class StockRateIndexService {
  private readonly context = 'StockRateIndexService';

  constructor(
    private readonly datasource: DataSource,
    private readonly customLogger: CustomLogger,
  ) {}

  async getRateIndexData(groupCode: IndexRateGroupCode) {
    this.customLogger.info(`get rate index data for group code: ${groupCode}`, this.context);
    const result = await this.datasource.manager.find(StockLiveData, {
      where: { stock: { groupCode } },
      relations: ['stock'],
    });

    if (!result.length) {
      this.customLogger.warn(`Rate data not found for group code: ${groupCode}`, this.context);
      throw new NotFoundException('Rate data not found');
    }
    return result;
  }

  async getStockRateData() {
    const groupCode: IndexRateGroupCode = 'RATE';
    const result = await this.getRateIndexData(groupCode);
    return result.map((val) => new StockIndexRateResponse(val));
  }
  async getStockIndexData() {
    const groupCode: IndexRateGroupCode = 'INX';
    const result = await this.getRateIndexData(groupCode);
    return result.map((val) => new StockIndexRateResponse(val));
  }
  async getStockRateIndexDate(): Promise<StockIndexRateResponse[]> {
    const index = await this.getStockIndexData();
    const rate = await this.getStockRateData();
    return [...index, ...rate];
  }
}
