import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource, EntityManager } from 'typeorm';
import { OpenapiLiveData } from '@/scraper/openapi/api/openapiLiveData.api';
import { DECREASE_STOCK_QUERY, INCREASE_STOCK_QUERY } from '@/scraper/openapi/constants/query';
import { Json, OpenapiQueue } from '@/scraper/openapi/queue/openapi.queue';
import { TR_IDS } from '@/scraper/openapi/type/openapiUtil.type';
import { FluctuationRankStock } from '@/stock/domain/FluctuationRankStock.entity';
import { Stock } from '@/stock/domain/stock.entity';
import { CustomLogger } from '@/common/logger/customLogger';

@Injectable()
export class OpenapiFluctuationData {
  private readonly fluctuationUrl = '/uapi/domestic-stock/v1/ranking/fluctuation';
  private readonly liveUrl = '/uapi/domestic-stock/v1/quotations/inquire-price';
  private readonly context = 'OpenapiFluctuationData';

  constructor(
    private readonly datasource: DataSource,
    private readonly openApiQueue: OpenapiQueue,
    private readonly openApiLive: OpenapiLiveData,
    private readonly customLogger: CustomLogger,
  ) {
    setTimeout(() => this.getFluctuationRankStocks(), 1000);
  }

  @Cron('*/1 9-15 * * 1-5')
  async getFluctuationRankStocks() {
    this.customLogger.info('Start getFluctuationRankStocks', this.context);
    await this.getFluctuationRankFromApi(true);
    await this.getFluctuationRankFromApi(false);
  }

  async getFluctuationRankFromApi(isRising: boolean) {
    this.customLogger.info(`Get fluctuation rank stocks, isRising: ${isRising}`, this.context);
    const query = isRising ? INCREASE_STOCK_QUERY : DECREASE_STOCK_QUERY;

    this.customLogger.info(`Delete fluctuation rank stocks`, this.context);
    await this.datasource.manager.delete(FluctuationRankStock, { isRising });

    this.customLogger.info('Enqueue getFluctuationRankFromApi requests', this.context);
    this.openApiQueue.enqueue({
      url: this.fluctuationUrl,
      query,
      trId: TR_IDS.FLUCTUATION_DATA,
      callback: this.getFluctuationRankStocksCallback(isRising),
    });
  }

  private getFluctuationRankStocksCallback(isRising: boolean) {
    this.customLogger.info(`Fluctuation rank stocks Callback, isRising: ${isRising}`, this.context);
    return async (data: Json) => {
      const save = this.convertToFluctuationRankStock(data, isRising);
      this.customLogger.info(`Converted fluctuation data: ${JSON.stringify(save)}`, this.context);

      await this.saveFluctuationRankStocks(save, this.datasource.manager);

      save.forEach((data) => {
        const stockId = data.stock.id;
        this.insertLiveDataRequest(stockId);
      });
    };
  }

  private convertToFluctuationRankStock(data: Json, isRising: boolean) {
    this.customLogger.info(`Convert OpenAPI data to fluctuation rank stocks`, this.context);
    if (!Array.isArray(data.output))
      return [
        {
          rank: Number(data.output.data_rank),
          stock: { id: data.output.stck_shrn_iscd } as Stock,
          isRising,
        },
      ];
    return data.output.slice(0, 20).map((result: Record<string, string>) => ({
      rank: Number(result.data_rank),
      stock: { id: result.stck_shrn_iscd } as Stock,
      isRising,
    }));
  }

  private insertLiveDataRequest(stockId: string) {
    this.customLogger.info(`Enqueue live data request for stock: ${stockId}`, this.context);
    this.openApiQueue.enqueue({
      url: this.liveUrl,
      query: {
        fid_cond_mrkt_div_code: 'J',
        fid_input_iscd: stockId,
      },
      trId: TR_IDS.LIVE_DATA,
      callback: this.openApiLive.getLiveDataSaveCallback(stockId),
    });
  }

  private async saveFluctuationRankStocks(
    result: Omit<FluctuationRankStock, 'id' | 'createdAt'>[],
    manager: EntityManager,
  ) {
    this.customLogger.info(`Save fluctuation rank stocks to DB`, this.context);
    await manager
      .getRepository(FluctuationRankStock)
      .createQueryBuilder()
      .insert()
      .into(FluctuationRankStock)
      .values(result)
      .execute();
  }
}
