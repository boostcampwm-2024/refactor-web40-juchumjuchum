import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Logger } from 'winston';
import { NewsInfoDto } from './dto/newsInfoDto';
import { NewsItemDto } from './dto/newsItemDto';
import { CrawlingDataDto } from '@/news/dto/crawlingData.dto';

@Injectable()
export class NewsCrawlingService {
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
    const newsUrl = `${process.env.NAVER_NEWS_URL}?query=${encodedStockName}&display=8&sort=sim`;
    try {
      const res: NewsInfoDto = await axios(newsUrl, {
        method: 'GET',
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
        },
      }).then((r) => r.data);
      return {
        stock: stockName,
        response: await this.extractNaverNews(res),
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
      news: crawledNews.filter((n) => {
        return (
          n.category === this.category.ECONOMICS ||
          n.category === this.category.IT ||
          n.category === this.category.WORLD
        );
      }),
    } as CrawlingDataDto;
  }
}
