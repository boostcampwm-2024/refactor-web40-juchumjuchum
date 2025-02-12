import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';
import { openApiConfig } from '../config/openapi.config';
import { isOpenapiLiveData } from '../type/openapiLiveData.type';
import { TR_IDS } from '../type/openapiUtil.type';
import { getOpenApi } from '../util/openapiUtil.api';
import { Json, OpenapiQueue } from '@/scraper/openapi/queue/openapi.queue';
import { Stock } from '@/stock/domain/stock.entity';
import { StockLiveData } from '@/stock/domain/stockLiveData.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OpenapiLiveData {
  private readonly url: string =
    '/uapi/domestic-stock/v1/quotations/inquire-ccnl';
  constructor(
    private readonly datasource: DataSource,
    private readonly openapiQueue: OpenapiQueue,
    @Inject('winston') private readonly logger: Logger,
  ) {
    this.initializeTopMarketCapStocks(); // 앱 시작시 시총 상위 10개 종목 실시간 데이터 요청
  }

  async saveLiveData(data: StockLiveData) {
    await this.datasource.manager
      .getRepository(StockLiveData)
      .createQueryBuilder()
      .insert()
      .values(data)
      .orUpdate(
        [
          'current_price',
          'change_rate',
          'volume',
          'high',
          'low',
          'open',
          'updatedAt',
        ],
        ['stock_id'],
      )
      .execute();
  }

  // 현재가 체결
  convertResponseToStockLiveData = (
    data: OpenapiLiveData,
    stockId: string,
  ): StockLiveData | undefined => {
    const stockLiveData = new StockLiveData();
    if (isOpenapiLiveData(data)) {
      stockLiveData.stock = { id: stockId } as Stock;
      stockLiveData.currentPrice = parseFloat(data.stck_prpr);
      stockLiveData.changeRate = parseFloat(data.prdy_ctrt);
      stockLiveData.volume = parseInt(data.acml_vol);
      stockLiveData.high = parseFloat(data.stck_hgpr);
      stockLiveData.low = parseFloat(data.stck_lwpr);
      stockLiveData.open = parseFloat(data.stck_oprc);
      stockLiveData.updatedAt = new Date();
      return stockLiveData;
    }
  };

  convertLiveData(messages: Record<string, string>[]): StockLiveData[] {
    const stockData: StockLiveData[] = [];
    messages.map((message) => {
      const stockLiveData = new StockLiveData();
      stockLiveData.stock = { id: message.STOCK_ID } as Stock;
      stockLiveData.currentPrice = parseFloat(message.STCK_PRPR);
      stockLiveData.changeRate = parseFloat(message.PRDY_CTRT);
      stockLiveData.volume = parseInt(message.ACML_VOL);
      stockLiveData.high = parseFloat(message.STCK_HGPR);
      stockLiveData.low = parseFloat(message.STCK_LWPR);
      stockLiveData.open = parseFloat(message.STCK_OPRC);
      stockLiveData.updatedAt = new Date();

      stockData.push(stockLiveData);
    });
    return stockData;
  }

  @Cron('30 7 * * *') // 매일 오전 7시 30분 (장 시작 전)
  private async initializeTopMarketCapStocks() {
    try {
      const result = await this.datasource
        .getRepository(Stock)
        .createQueryBuilder('stock')
        .leftJoin('stock_detail', 'stockDetail', 'stock.id = stockDetail.stock_id')
        .select([
          'stock.id AS id',
          'stockDetail.marketCap AS marketCap',
        ])
        .orderBy('stockDetail.marketCap', 'DESC')
        .limit(10)
        .getRawMany();

      // 각 종목에 대해 실시간 데이터 요청
      result.forEach(stock => {
        this.insertLiveDataRequest(stock.id);
      });

      this.logger.info('Top 10 market cap stocks initialized for live data', {
        stocks: result.map(stock => stock.id)
      });
    } catch (error) {
      this.logger.error('Failed to initialize top market cap stocks', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  insertLiveDataRequest(stockId: string) {
    this.logger.info(`Insert live data request for stockId : ${stockId}`);
    const query = this.makeLiveDataQuery(stockId);
    this.openapiQueue.enqueue({
      url: this.url,
      query,
      trId: TR_IDS.LIVE_DATA,
      callback: this.getLiveDataSaveCallback(stockId),
    });
  }

  async connectLiveData(stockId: string, config: typeof openApiConfig) {
    const query = this.makeLiveDataQuery(stockId);

    try {
      const result = await getOpenApi(
        this.url,
        config,
        query,
        TR_IDS.LIVE_DATA,
      );
      return result;
    } catch (error) {
      this.logger.warn(`Connect live data error : ${error}`);
    }
  }

  getLiveDataSaveCallback(stockId: string) {
    return async (data: Json) => {
      if (Array.isArray(data.output)) return;
      const stockLiveData = this.convertToStockLiveData(data.output, stockId);
      await this.saveIndividualLiveData(stockLiveData);
    };
  }

  private makeLiveDataQuery(stockId: string, code: 'J' = 'J') {
    return {
      fid_cond_mrkt_div_code: code,
      fid_input_iscd: stockId,
    };
  }

  private convertToStockLiveData(
    stockData: Record<string, string>,
    stockId: string,
  ): StockLiveData {
    const stockLiveData = new StockLiveData();
    stockLiveData.stock = { id: stockId } as Stock;
    stockLiveData.currentPrice = parseFloat(stockData.stck_prpr);
    stockLiveData.changeRate = parseFloat(stockData.prdy_ctrt);
    stockLiveData.volume = parseInt(stockData.acml_vol);
    stockLiveData.high = parseFloat(stockData.stck_hgpr);
    stockLiveData.low = parseFloat(stockData.stck_lwpr);
    stockLiveData.open = parseFloat(stockData.stck_oprc);
    stockLiveData.updatedAt = new Date();
    return stockLiveData;
  }

  private async saveIndividualLiveData(data: StockLiveData) {
    return await this.datasource.manager
      .getRepository(StockLiveData)
      .createQueryBuilder()
      .insert()
      .into(StockLiveData)
      .values(data)
      .orUpdate(
        [
          'current_price',
          'change_rate',
          'volume',
          'high',
          'low',
          'open',
          'updatedAt',
        ],
        ['stock_id'],
      )
      .execute();
  }
}
