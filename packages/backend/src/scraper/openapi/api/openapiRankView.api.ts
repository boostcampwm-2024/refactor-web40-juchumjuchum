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

  // TODO: 현재 조회수 상위 10개 종목을 1분마다 openAPI로 요청하고 있는데,
  // 현재는 조회수 상위 10개를 보여주고 있지 않기 때문에 삭제하거나 "시가총액" 상위 10개 종목으로 변경해야 함
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
