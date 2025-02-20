import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockNews } from '@/news/domain/stockNews.entity';
import { StockNewsController } from '@/news/stockNews.controller';
import { StockNewsRepository } from '@/news/stockNews.repository';
import { NewsCrawlingService } from '@/news/newsCrawling.service';
import { StockNewsOrchestrationService } from '@/news/StockNewsOrchestrationService';
import { NewsSummaryService } from '@/news/newsSummary.service';
import { StockModule } from '@/stock/stock.module';

@Module({
  imports: [TypeOrmModule.forFeature([StockNews]), StockModule],
  controllers: [StockNewsController],
  providers: [StockNewsRepository, NewsCrawlingService, StockNewsOrchestrationService, NewsSummaryService],
  exports: [],
})
export class StockNewsModule {}
