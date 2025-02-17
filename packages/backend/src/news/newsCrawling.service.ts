import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Logger } from 'winston';
import { NewsInfoDto } from './dto/newsInfoDto';
import { NewsItemDto } from './dto/newsItemDto';
import { CrawlingDataDto } from '@/news/dto/crawlingData.dto';

@Injectable()
export class NewsCrawlingService {
  private readonly MAX_NEWS_COUNT = 5;

  constructor(@Inject('winston') private readonly logger: Logger) {
  }

  private readonly category = {
    ECONOMICS: '경제',
    WORLD: '세계',
    IT: 'IT/과학',
  };

  // naver news API 이용해 뉴스 정보 얻어오기
  async getNewsLinks(stockName: string) {
    const encodedStockName = encodeURI(stockName);
    // 10개 요청
    const newsUrl = `${process.env.NAVER_NEWS_URL}?query=${encodedStockName}&display=10&sort=sim`;
    try {
      const res: NewsInfoDto = await axios(newsUrl, {
        method: 'GET',
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
        },
      }).then((r) => r.data);
      // 네이버 뉴스만 필터링 후 상위 5개만 선택
      const naverNews = await this.extractNaverNews(res);
      const limitedNews = naverNews.slice(0, this.MAX_NEWS_COUNT);

      return {
        stock: stockName,
        response: limitedNews,
      };
    } catch (err) {
      this.logger.error(err);
    }
  }

  async extractNaverNews(newsData: NewsInfoDto) {
    return newsData.items.filter((e) => e.link.includes('n.news.naver.com'));
  }

  // 얻어온 뉴스 정보들 중 naver news에 기사가 있는 사이트에서 제목, 본문, 생성 날짜등을 크롤링해오기
  async crawling(stock: string, news: NewsItemDto[]) {
    const crawledNews = await Promise.all(
      news.map(async (n) => {
        const url = decodeURI(n.link);
        return await axios(url, {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        }).then(async (r) => {
          const htmlString = await r.data;
          const $ = cheerio.load(htmlString);

          const category = $(
            'li.Nlist_item._LNB_ITEM.is_active .Nitem_link_menu',
          ).text();
          if (this.isAvailableCategory(category)) {
            return null;
          }
          const date = $('span._ARTICLE_DATE_TIME').attr('data-date-time');

          const title = $('#title_area').text();
          const content = $('#dic_area').text();

          return {
            category: category,
            date: date,
            title: title,
            content: content,
            url: url,
          };
        });
      }),
    );
    return {
      stockName: stock,
      news: crawledNews.filter((n) => n !== null),
    } as CrawlingDataDto;
  }

  isAvailableCategory(category: string) {
    return (
      category !== this.category.ECONOMICS &&
      category !== this.category.IT &&
      category !== this.category.WORLD
    );
  }

  changeToKorTime() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 9 * 60 * 60000);
  }

  isSameDate(date: string, now: Date) {
    const parsedDate = new Date(date);

    return (
      parsedDate.getFullYear() === now.getFullYear() &&
      parsedDate.getMonth() === now.getMonth() &&
      parsedDate.getDate() === now.getDate()
    );
  }
}
