import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { NewsCrawlingService } from '@/news/newsCrawling.service';
import { NewsSummaryService } from '@/news/newsSummary.service';
import { StockNewsRepository } from '@/news/stockNews.repository';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class StockNewsOrchestrationService {
  constructor(
    @Inject('winston') private readonly logger: Logger,
    private readonly newsCrawlingService: NewsCrawlingService,
    private readonly newsSummaryService: NewsSummaryService,
    private readonly stockNewsRepository: StockNewsRepository,
  ) {}

  // 주요 종목 정보를 상수로 관리
  private readonly STOCK_INFO = [
    { id: '005930', name: '삼성전자' },
    { id: '000660', name: 'SK하이닉스' },
    { id: '373220', name: 'LG에너지솔루션' },
    { id: '207940', name: '삼성바이오로직스' },
    { id: '005380', name: '현대차' },
    { id: '000270', name: '기아' },
    { id: '068270', name: '셀트리온' },
    { id: '035420', name: 'NAVER' },
    { id: '105560', name: 'KB금융' },
    { id: '329180', name: 'HD현대중공업' },
  ] as const;

  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 10000;  // 10초
  private readonly PROCESS_DELAY = 3000;  // 주식 처리 사이 대기 시간 (3초)
  
  private getRetryDelay(retryCount: number): number {
    return this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
  }

  private async processStockNews(
    stock: { id: string; name: string }, 
    retryCount = 0
  ): Promise<{ success: boolean; stock: { id: string; name: string } }> {
    try {
      this.logger.info(`Processing news for ${stock.name} (${stock.id}) - Attempt ${retryCount + 1}`);
      
      const stockDataList = await this.newsCrawlingService.getNewsLinks(stock.name);
      
      if (!stockDataList) {
        this.logger.warn(`No news found for ${stock.name}`);
        return { success: false, stock };
      }

      const stockNewsData = await this.newsCrawlingService.crawling(
        stockDataList.stock,
        stockDataList.response,
      );

      const rawSummarizedData = await this.newsSummaryService.summarizeNews(stockNewsData);

      if (!rawSummarizedData) {
        throw new Error(`Failed to summarize news for ${stock.name}`);
      }

      const finalSummarizedData = {
        ...rawSummarizedData,
        stock_id: stock.id,
        stock_name: stock.name,
      };

      await this.stockNewsRepository.create(finalSummarizedData);
      this.logger.info(`Successfully saved news for ${stock.name}`);
      return { success: true, stock };
      
    } catch (error) {
      this.logger.error(`Error processing news for ${stock.name}:`, error);
      
      if (retryCount < this.MAX_RETRIES) {
        const delay = this.getRetryDelay(retryCount);
        this.logger.info(`Retrying ${stock.name} in ${delay/1000}s... (${retryCount + 1}/${this.MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.processStockNews(stock, retryCount + 1);
      }
      
      return { success: false, stock };
    }
  }

  @Cron('19 15 0 * * *')
  public async orchestrateStockProcessing(): Promise<void> {
    const results: { success: boolean; stock: { id: string; name: string } }[] = [];
    
    for (const stock of this.STOCK_INFO) {
      const result = await this.processStockNews(stock);
      results.push(result);
      
      // 다음 주식 처리 전 대기
      if (stock !== this.STOCK_INFO[this.STOCK_INFO.length - 1]) {  // 마지막 항목이 아닌 경우에만
        await new Promise(resolve => setTimeout(resolve, this.PROCESS_DELAY));
      }
    }

    const successfulStocks = results
      .filter(r => r.success)
      .map(r => r.stock.name);
    
    const failedStocks = results
      .filter(r => !r.success)
      .map(r => r.stock.name);

    this.logger.info('News processing completed.');
    this.logger.info(`Successful stocks: ${successfulStocks.join(', ') || 'None'}`);
    this.logger.info(`Failed stocks: ${failedStocks.join(', ') || 'None'}`);

    if (failedStocks.length > 0) {
      this.logger.warn(`Failed to process news for ${failedStocks.length} stocks after ${this.MAX_RETRIES} retries`);
    }
  }
}
