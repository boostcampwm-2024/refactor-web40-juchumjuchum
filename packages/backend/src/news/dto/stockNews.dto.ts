import { IsString, MaxLength } from 'class-validator';
import { StockNews } from '@/news/domain/stockNews.entity';

export class CreateStockNewsDto {
  @IsString()
  stock_id: string;

  @IsString()
  stock_name: string;

  @IsString()
  link: string;

  @IsString()
  link_titles: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(10000)
  summary: string;

  @IsString()
  positive_content: string;

  @IsString()
  negative_content: string;

  @IsString()
  positive_content_summary: string;

  @IsString()
  negative_content_summary: string;
}

export class StockNewsResponse {
  constructor(stockNews: StockNews) {
    this.stockId = stockNews.stockId;
    this.stockName = stockNews.stockName;
    this.link = stockNews.link;
    this.linkTitles = stockNews.linkTitles;
    this.title = stockNews.title;
    this.summary = stockNews.summary;
    this.positiveContent = stockNews.positiveContent;
    this.negativeContent = stockNews.negativeContent;
    this.positiveContentSummary = stockNews.positiveContentSummary;
    this.negativeContentSummary = stockNews.negativeContentSummary;
    this.createdAt = stockNews.createdAt;
  }

  stockId: string;
  stockName: string;
  link: string;
  linkTitles: string;
  title: string;
  summary: string;
  positiveContent: string;
  negativeContent: string;
  positiveContentSummary: string;
  negativeContentSummary: string;
  createdAt: Date;
}