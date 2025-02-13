import { Test, TestingModule } from '@nestjs/testing';

import axios from 'axios';
import { Logger } from 'winston';
import { NewsInfoDto } from './dto/newsInfoDto';
import { NewsItemDto } from './dto/newsItemDto';
import { NewsCrawlingService } from '@/news/newsCrawling.service';

jest.mock('axios');
const mockedAxios = jest.mocked(axios);

describe('NewsCrawlingService', () => {
  let service: NewsCrawlingService;
  let mockLogger: Partial<Logger>;

  beforeEach(async () => {
    // Logger mock 생성
    mockLogger = {
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsCrawlingService,
        {
          provide: 'winston',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<NewsCrawlingService>(NewsCrawlingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNewsLinks', () => {
    const mockNewsResponse: NewsInfoDto = {
      lastBuildDate: 'Wed, 12 Feb 2025 16:18:10 +0900',
      total: 1,
      start: 1,
      display: 2,
      items: [
        {
          title:
            '<b>삼성</b>생명·화재, 2800억 삼전 주식 처분…&quot;금산법 리스크 해소&quot;',
          originallink: 'https://www.newsis.com/view/NISX20250211_0003061741',
          link: 'https://n.news.naver.com/mnews/article/003/0013061217?sid=101',
          description:
            '삼성생명과 삼성화재가 \'금융산업의 구조개선에 관한 법률(금산법)\' 위반 리스크 해소를 위해 약 2800억원 상당의 <b>삼성전자</b> 지분을 매각한다. 삼성생명은 11일 이사회를 열고 <b>삼성전자</b> 주식 425만2305주를... ',
          pubDate: 'Tue, 11 Feb 2025 20:58:00 +0900',
        },
        {
          title: '<b>삼성전자</b>, \'AI 기능 강화\' 55형 OLED TV 신모델 출시',
          originallink:
            'https://www.yna.co.kr/view/AKR20250212030500003?input=1195m',
          link: 'https://n.news.naver.com/mnews/article/001/0015206869?sid=101',
          description:
            '<b>삼성전자</b>는 12일 인공지능(AI) 기능을 강화한 55형 OLED(유기발광다이오드) TV 신제품을 국내 출시한다. 신제품은 2025년 삼성 TV의 신규 AI 신기능을 대거 탑재했다. \'AI 스마트 홈\' 기능을 통해 사용자 생활 패턴, 집안 기기... ',
          pubDate: 'Wed, 12 Feb 2025 08:26:00 +0900',
        },
        {
          title:
            '금산법-밸류업 충돌…<b>삼성전자</b>, 자사주 소각 때마다 블록딜 [마켓딥다이...',
          originallink:
            'https://www.wowtv.co.kr/NewsCenter/News/Read?articleId=A202502120436&t=NNv',
          link: 'https://n.news.naver.com/mnews/article/215/0001198266?sid=101',
          description:
            '반등에 나섰던 <b>삼성전자</b>가 다시 하락 전환했습니다. 삼성생명과 삼성화재의 블록딜 때문인데요. 최민정 기자가 자세히 짚어봅니다. 2,800억 원의 삼성생명과 삼성화재 블록딜, 시간 외 대량 매매로 <b>삼성전자</b>의주가도... ',
          pubDate: 'Wed, 12 Feb 2025 14:48:00 +0900',
        },
      ],
    };

    it('should fetch and filter naver news correctly', async () => {
      // Axios mock 설정
      mockedAxios.mockResolvedValueOnce({ data: mockNewsResponse });

      const result = await service.getNewsLinks('삼성전자');

      expect(result).toEqual({
        stock: '삼성전자',
        response: [
          {
            title:
              '<b>삼성</b>생명·화재, 2800억 삼전 주식 처분…&quot;금산법 리스크 해소&quot;',
            originallink: 'https://www.newsis.com/view/NISX20250211_0003061741',
            link: 'https://n.news.naver.com/mnews/article/003/0013061217?sid=101',
            description:
              '삼성생명과 삼성화재가 \'금융산업의 구조개선에 관한 법률(금산법)\' 위반 리스크 해소를 위해 약 2800억원 상당의 <b>삼성전자</b> 지분을 매각한다. 삼성생명은 11일 이사회를 열고 <b>삼성전자</b> 주식 425만2305주를... ',
            pubDate: 'Tue, 11 Feb 2025 20:58:00 +0900',
          },
          {
            title: '<b>삼성전자</b>, \'AI 기능 강화\' 55형 OLED TV 신모델 출시',
            originallink:
              'https://www.yna.co.kr/view/AKR20250212030500003?input=1195m',
            link: 'https://n.news.naver.com/mnews/article/001/0015206869?sid=101',
            description:
              '<b>삼성전자</b>는 12일 인공지능(AI) 기능을 강화한 55형 OLED(유기발광다이오드) TV 신제품을 국내 출시한다. 신제품은 2025년 삼성 TV의 신규 AI 신기능을 대거 탑재했다. \'AI 스마트 홈\' 기능을 통해 사용자 생활 패턴, 집안 기기... ',
            pubDate: 'Wed, 12 Feb 2025 08:26:00 +0900',
          },
          {
            title:
              '금산법-밸류업 충돌…<b>삼성전자</b>, 자사주 소각 때마다 블록딜 [마켓딥다이...',
            originallink:
              'https://www.wowtv.co.kr/NewsCenter/News/Read?articleId=A202502120436&t=NNv',
            link: 'https://n.news.naver.com/mnews/article/215/0001198266?sid=101',
            description:
              '반등에 나섰던 <b>삼성전자</b>가 다시 하락 전환했습니다. 삼성생명과 삼성화재의 블록딜 때문인데요. 최민정 기자가 자세히 짚어봅니다. 2,800억 원의 삼성생명과 삼성화재 블록딜, 시간 외 대량 매매로 <b>삼성전자</b>의주가도... ',
            pubDate: 'Wed, 12 Feb 2025 14:48:00 +0900',
          },
        ],
      });
    });

    it('should handle errors correctly', async () => {
      // Axios mock에 에러 설정
      mockedAxios.mockRejectedValueOnce(new Error('API Error'));

      await service.getNewsLinks('삼성전자');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('extractNaverNews', () => {

    it('should filter only naver news', async () => {
      const mockData: NewsInfoDto = {
        lastBuildDate: 'Wed, 12 Feb 2025 16:18:10 +0900',
        total: 1,
        start: 1,
        display: 2,
        items: [
          {
            title:
              '<b>삼성</b>생명·화재, 2800억 삼전 주식 처분…&quot;금산법 리스크 해소&quot;',
            originallink: 'https://www.newsis.com/view/NISX20250211_0003061741',
            link: 'https://n.news.naver.com/mnews/article/003/0013061217?sid=101',
            description:
              '삼성생명과 삼성화재가 \'금융산업의 구조개선에 관한 법률(금산법)\' 위반 리스크 해소를 위해 약 2800억원 상당의 <b>삼성전자</b> 지분을 매각한다. 삼성생명은 11일 이사회를 열고 <b>삼성전자</b> 주식 425만2305주를... ',
            pubDate: 'Tue, 11 Feb 2025 20:58:00 +0900',
          },
          {
            title: '<b>삼성전자</b>, \'AI 기능 강화\' 55형 OLED TV 신모델 출시',
            originallink:
              'https://www.yna.co.kr/view/AKR20250212030500003?input=1195m',
            link: 'https://www.yna.co.kr/view/AKR20250212030500003?input=1195m',
            description:
              '<b>삼성전자</b>는 12일 인공지능(AI) 기능을 강화한 55형 OLED(유기발광다이오드) TV 신제품을 국내 출시한다. 신제품은 2025년 삼성 TV의 신규 AI 신기능을 대거 탑재했다. \'AI 스마트 홈\' 기능을 통해 사용자 생활 패턴, 집안 기기... ',
            pubDate: 'Wed, 12 Feb 2025 08:26:00 +0900',
          },
          {
            title:
              '금산법-밸류업 충돌…<b>삼성전자</b>, 자사주 소각 때마다 블록딜 [마켓딥다이...',
            originallink:
              'https://www.wowtv.co.kr/NewsCenter/News/Read?articleId=A202502120436&t=NNv',
            link: 'https://n.news.naver.com/mnews/article/215/0001198266?sid=101',
            description:
              '반등에 나섰던 <b>삼성전자</b>가 다시 하락 전환했습니다. 삼성생명과 삼성화재의 블록딜 때문인데요. 최민정 기자가 자세히 짚어봅니다. 2,800억 원의 삼성생명과 삼성화재 블록딜, 시간 외 대량 매매로 <b>삼성전자</b>의주가도... ',
            pubDate: 'Wed, 12 Feb 2025 14:48:00 +0900',
          },
        ],
      };

      const result = await service.extractNaverNews(mockData);
      expect(result.length).toBe(2);
      expect(result[0].link).toContain('n.news.naver.com');
    });
  });

  describe('crawling', () => {
    const mockNewsItems: NewsItemDto[] = [
      {
        title:
          '<b>삼성</b>생명·화재, 2800억 삼전 주식 처분…&quot;금산법 리스크 해소&quot;',
        originallink: 'https://www.newsis.com/view/NISX20250211_0003061741',
        link: 'https://n.news.naver.com/mnews/article/003/0013061217?sid=101',
        description:
          '삼성생명과 삼성화재가 \'금융산업의 구조개선에 관한 법률(금산법)\' 위반 리스크 해소를 위해 약 2800억원 상당의 <b>삼성전자</b> 지분을 매각한다. 삼성생명은 11일 이사회를 열고 <b>삼성전자</b> 주식 425만2305주를... ',
        pubDate: 'Tue, 11 Feb 2025 20:58:00 +0900',
      },
    ];

    const mockHtmlResponse = `
      <html>
        <li class="Nlist_item _LNB_ITEM is_active">
          <a class="Nitem_link_menu">경제</a>
        </li>
        <span class="_ARTICLE_DATE_TIME" data-date-time="2025-02-11 20:58:58"></span>
        <div id="title_area">삼성생명·화재, 2800억 삼전 주식 처분…"금산법 리스크 해소"</div>
        <div id="dic_area">삼성생명은 11일 이사회를 열고 삼성전자 주식 425만2305주를 2364억2814만8000억원에 매각한다고 공시했다. 삼성화재도 같은날 삼성전자 주식 74만3104주를 413억1658만2400원에 매각한다고 공시했다.</div>
      </html>
    `;

    it('should crawl news content correctly', async () => {
      mockedAxios.mockResolvedValueOnce({ data: mockHtmlResponse });

      const result = await service.crawling('삼성전자', mockNewsItems);

      expect(result).toEqual({
        stockName: '삼성전자',
        news: [
          {
            category: '경제',
            date: '2025-02-11 20:58:58',
            title: '삼성생명·화재, 2800억 삼전 주식 처분…"금산법 리스크 해소"',
            content: '삼성생명은 11일 이사회를 열고 삼성전자 주식 425만2305주를 2364억2814만8000억원에 매각한다고 공시했다. 삼성화재도 같은날 삼성전자 주식 74만3104주를 413억1658만2400원에 매각한다고 공시했다.',
            url: 'https://n.news.naver.com/mnews/article/003/0013061217?sid=101',
          },
        ],
      });
    });

    it('should filter out news with invalid categories', async () => {
      const invalidCategoryHtml = mockHtmlResponse.replace('경제', '스포츠');
      mockedAxios.mockResolvedValueOnce({ data: invalidCategoryHtml });

      const result = await service.crawling('삼성전자', mockNewsItems);

      expect(result.news).toHaveLength(0);
    });
  });
});
