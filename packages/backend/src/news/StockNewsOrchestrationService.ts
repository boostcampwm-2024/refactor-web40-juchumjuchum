import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { NewsCrawlingService } from '@/news/newsCrawling.service';
import { NewsSummaryService } from '@/news/newsSummary.service';
import { StockNewsRepository } from '@/news/stockNews.repository';
import { Cron } from '@nestjs/schedule';
import { formatErrorMessage } from './error/formatErrorMessage';
import { NewsLinkNotExistException } from '@/news/error/newsLinkNotExist.error';
import { StockService } from '@/stock/stock.service';

@Injectable()
export class StockNewsOrchestrationService {
  constructor(
    @Inject('winston') private readonly logger: Logger,
    private readonly newsCrawlingService: NewsCrawlingService,
    private readonly newsSummaryService: NewsSummaryService,
    private readonly stockNewsRepository: StockNewsRepository,
    private readonly stockService : StockService,
  ) {}

  // 주요 종목 정보를 상수로 관리
  // private readonly STOCK_INFO = [
  //   { id: '005930', name: '삼성전자' },
  //   { id: '000660', name: 'SK하이닉스' },
  //   { id: '373220', name: 'LG에너지솔루션' },
  //   { id: '207940', name: '삼성바이오로직스' },
  //   { id: '005380', name: '현대차' },
  //   { id: '000270', name: '기아' },
  //   { id: '068270', name: '셀트리온' },
  //   { id: '035420', name: 'NAVER' },
  //   { id: '105560', name: 'KB금융' },
  //   { id: '329180', name: 'HD현대중공업' },
  // ] as const;

  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 60000;  // 60초
  private readonly PROCESS_DELAY = 3000;  // 주식 처리 사이 대기 시간 (3초)
  private readonly INPUT_TOKEN_LIMIT = 7600;  // 개별 요청당 토큰 수 제한
  
  private getRetryDelay(): number {
    return this.INITIAL_RETRY_DELAY;
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
      
      // 토큰 수 계산
      let tokenLength =
        await this.newsSummaryService.calculateToken(stockNewsData);

      while (tokenLength > this.INPUT_TOKEN_LIMIT) {
        this.logger.warn('Token length is too long. Reducing news data');
        stockNewsData.news.pop();
        tokenLength =
          await this.newsSummaryService.calculateToken(stockNewsData);
      }
      this.logger.info(`final token length: ${tokenLength}`);

      const rawSummarizedData = await this.newsSummaryService.summarizeNews(stockNewsData);
      this.logger.info('rawSummarizedData:');
      // console.log(rawSummarizedData);

      const finalSummarizedData = {
        ...rawSummarizedData,
        stock_id: stock.id,
        stock_name: stock.name,
      };

      // console.log(finalSummarizedData);

      await this.stockNewsRepository.create(finalSummarizedData);
      this.logger.info(`Successfully saved news for ${stock.name}`);
      return { success: true, stock };
      
    } catch (error) {
      const errorMessage = formatErrorMessage(error, stock.name);
      this.logger.error(errorMessage);

      // 요약할 뉴스가 (링크가) 존재하지 않는 경우 재시도 없이 종료
      if(error instanceof NewsLinkNotExistException) {
        return { success: false, stock };
      }
      
      if (retryCount < this.MAX_RETRIES) {
        const delay = this.getRetryDelay();
        this.logger.info(`Retrying ${stock.name} in ${delay/1000}s... (${retryCount + 1}/${this.MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.processStockNews(stock, retryCount + 1);
      }
      
      return { success: false, stock };
    }
  }

  @Cron('0 0 0 * * *')
  public async orchestrateStockProcessing(): Promise<void> {
    const results: { success: boolean; stock: { id: string; name: string } }[] = [];

    const stocksData = await this.stockService.getTopStocksByMarketCap(10);
    // 필요한 속성만 추출하여 새 배열 생성
    const STOCK_INFO_TOP10_BY_MARKETCAP = stocksData.map(stock => ({
      id: stock.id,
      name: stock.name
    }));
    
    for (const stock of STOCK_INFO_TOP10_BY_MARKETCAP) {
      const result = await this.processStockNews(stock);
      results.push(result);
      
      // 다음 주식 처리 전 대기
      if (stock !== STOCK_INFO_TOP10_BY_MARKETCAP[STOCK_INFO_TOP10_BY_MARKETCAP.length - 1]) {  // 마지막 항목이 아닌 경우에만
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
