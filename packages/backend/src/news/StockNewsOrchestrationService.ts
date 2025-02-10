import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { NewsCrawlingService } from '@/news/newsCrawling.service';
import { NewsSummaryService } from '@/news/newsSummary.service';
import { StockNewsRepository } from '@/news/stockNews.repository';
import { CrawlingDataDto } from '@/news/dto/crawlingData.dto';
import { Cron } from '@nestjs/schedule';
import { CreateStockNewsDto } from '@/news/dto/stockNews.dto';

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

  @Cron('19 15 0 * * *') //오후 3시 19분
  public async orchestrateStockProcessing() {
    for (const stock of this.STOCK_INFO) {
      try {
        this.logger.info(`Processing news for ${stock.name} (${stock.id})`);
        
        // 뉴스 링크 수집
        const stockDataList = await this.newsCrawlingService.getNewsLinks(stock.name);
        
        if (!stockDataList) {
          this.logger.warn(`No news found for ${stock.name}`);
          continue;
        }

        // 뉴스 크롤링
        const stockNewsData: CrawlingDataDto = await this.newsCrawlingService.crawling(
          stockDataList.stock,
          stockDataList.response,
        );

        // 데이터 요약
        let summarizedData = await this.newsSummaryService.summarizeNews({
          ...stockNewsData,
        });

        if(summarizedData)
          summarizedData = {
            ...summarizedData,
            stock_id: stock.id,      // stock_id 추가
            stock_name: stock.name,  // stock_name 추가
          }
        // DB 저장
        if (summarizedData) {
          await this.stockNewsRepository.create(summarizedData);
          this.logger.info(`Successfully saved news for ${stock.name}`);
        } else {
          this.logger.error(`Failed to summarize news for ${stock.name}`);
        }

      } catch (error) {
        this.logger.error(`Error processing news for ${stock.name}:`, error);
        continue; // 한 종목이 실패해도 다음 종목 처리
      }
    }
  }
}
