import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockNews } from '@/news/domain/stockNews.entity';
import { CreateStockNewsDto } from '@/news/dto/stockNews.dto';
import { NewsLinkNotExistException } from '@/news/error/newsLinkNotExist.error';

@Injectable()
export class StockNewsRepository {
  constructor(
    @InjectRepository(StockNews)
    private readonly stockNewsRepository: Repository<StockNews>,
  ) {}

  async create(dto: CreateStockNewsDto): Promise<StockNews> {
    console.log(dto);
    const stockNews = new StockNews();
    stockNews.stockId = dto.stock_id;
    stockNews.stockName = dto.stock_name;
    stockNews.link = dto.link;
    stockNews.title = dto.title;
    stockNews.summary = dto.summary;
    stockNews.positiveContent = dto.positive_content;
    stockNews.negativeContent = dto.negative_content;
    stockNews.positiveContentSummary = dto.positive_content_summary;
    stockNews.negativeContentSummary = dto.negative_content_summary;

    this.validateNewsExist(stockNews);

    return await this.stockNewsRepository.save(stockNews);
  }

  async findByStockId(stockId: string): Promise<StockNews[]> {
    return await this.stockNewsRepository.find({
      where: { stockId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByStockId(stockId: string): Promise<StockNews | null> {
    return await this.stockNewsRepository.findOne({
      where: { stockId },
      order: { createdAt: 'DESC' },
    });
  }

  private validateNewsExist(stockNews: StockNews) {
    // 1. link가 undefined나 null인 경우 체크
    if (!stockNews.link) {
      throw new NewsLinkNotExistException('link is null or undefined');
    }

    // 2. link가 빈 문자열인 경우 체크
    if (stockNews.link === '') {
      throw new NewsLinkNotExistException('link is empty string');
    }

    // 3. link가 빈 배열인 경우 체크
    if (Array.isArray(stockNews.link) && stockNews.link.length === 0) {
      throw new NewsLinkNotExistException('link array is empty');
    }

    // 4. link가 공백 문자로만 이루어진 경우도 체크
    if (typeof stockNews.link === 'string' && stockNews.link.trim() === '') {
      throw new NewsLinkNotExistException('link contains only whitespace');
    }
  }
}