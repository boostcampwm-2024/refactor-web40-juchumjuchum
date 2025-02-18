import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { OpenapiLiveData } from '@/scraper/openapi/api/openapiLiveData.api';
import { OpenapiQueue } from '@/scraper/openapi/queue/openapi.queue';
import { TR_IDS } from '@/scraper/openapi/type/openapiUtil.type';
import { Stock } from '@/stock/domain/stock.entity';
import { CustomLogger } from '@/common/logger/customLogger';

@Injectable()
export class OpenapiRankViewApi {
  private readonly liveUrl = '/uapi/domestic-stock/v1/quotations/inquire-price';
  private readonly context = 'OpenapiRankViewApi';

  constructor(
    private readonly datasource: DataSource,
    private readonly openApiLiveData: OpenapiLiveData,
    private readonly openApiQueue: OpenapiQueue,
    private readonly customLogger: CustomLogger,
  ) {
    setTimeout(() => this.getTopViewsStockLiveData(), 6000);
  }

  @Cron('*/1 9-15 * * 1-5')
  async getTopViewsStockLiveData() {
    this.customLogger.info('Enqueue getTopViewsStockLiveData requests', this.context);
    const date = await this.findTopViewsStocks();
    date.forEach((stock) => {
      this.openApiQueue.enqueue({
        url: this.liveUrl,
        query: {
          fid_cond_mrkt_div_code: 'J',
          fid_input_iscd: stock.id,
        },
        trId: TR_IDS.LIVE_DATA,
        callback: this.openApiLiveData.getLiveDataSaveCallback(stock.id),
      });
    });
  }

  private async findTopViewsStocks() {
    this.customLogger.info('Find top views stocks from DB', this.context);
    return await this.datasource.manager
      .getRepository(Stock)
      .createQueryBuilder('stock')
      .orderBy('stock.views', 'DESC')
      .limit(10)
      .getMany();
  }
}
