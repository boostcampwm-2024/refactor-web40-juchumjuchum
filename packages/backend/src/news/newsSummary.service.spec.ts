import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'winston';
import { NewsSummaryService } from './newsSummary.service';
import axios from 'axios';
import { CrawlingDataDto } from './dto/crawlingData.dto';
import { CreateStockNewsDto } from './dto/stockNews.dto';
import {
  SummaryFieldException,
  SummaryJsonException,
  SummaryAPIException,
  TokenAPIException,
} from './error/newsSummary.error';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('NewsSummaryService', () => {
  let mockLogger: Logger;
  let newsSummaryService: NewsSummaryService;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
    } as unknown as Logger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsSummaryService,
        {
          provide: 'winston',
          useValue: mockLogger,
        },
      ],
    }).compile();

    newsSummaryService = module.get<NewsSummaryService>(NewsSummaryService);
  });

  // 클로바 뉴스 요약 응답 예시 데이터 생성 함수
  const createMockClovaResponse = (content: string) => ({
    data: {
      result: {
        message: {
          role: 'assistant',
          content: content,
        },
      },
    },
  });

  // 크롤링 데이터 예시
  const mockCrwalingData: CrawlingDataDto = {
    stockName: '삼성전자',
    news: [
      {
        category: '경제',
        date: '2025.02.04',
        title: '삼성전자 실적 발표',
        content: '삼성전자가 좋은 실적을 발표했습니다.',
        url: 'http://example1.com',
      },
    ],
  };

  describe('클로바 뉴스 요약 성공', () => {
    test('클로바 뉴스 요약이 정상적으로 완료되면 정해진 형식의 데이터를 반환한다', async () => {
      // given
      const textContent = JSON.stringify({
        stock_id: '005930',
        stock_name: '삼성전자',
        link: 'http://example1.com',
        title: '삼성전자 실적 호조',
        summary: '실적이 좋습니다',
        positive_content: '긍정적입니다',
        negative_content: '해당사항 없음',
      });
      const mockClovaResponse = createMockClovaResponse(textContent);
      mockAxios.post.mockResolvedValue(mockClovaResponse);

      // when
      const result = await newsSummaryService.summarizeNews(mockCrwalingData);

      // then
      expect(result).toBeInstanceOf(CreateStockNewsDto);
      expect(result).toEqual({
        stock_id: '005930',
        stock_name: '삼성전자',
        link: 'http://example1.com',
        title: '삼성전자 실적 호조',
        summary: '실적이 좋습니다',
        positive_content: '긍정적입니다',
        negative_content: '해당사항 없음',
      });
    });

    test.each([
      [
        'stockId',
        {
          stockId: '005930',
          stock_name: '삼성전자',
          link: 'http://example1.com',
          title: '삼성전자 실적 호조',
          summary: '실적이 좋습니다',
          positive_content: '긍정적입니다',
          negative_content: '해당사항 없음',
        },
      ],
      [
        'stockName',
        {
          stock_id: '005930',
          stockName: '삼성전자',
          link: 'http://example1.com',
          title: '삼성전자 실적 호조',
          summary: '실적이 좋습니다',
          positive_content: '긍정적입니다',
          negative_content: '해당사항 없음',
        },
      ],
    ])(
      '클로바 뉴스 요약에 %s 필드 key값이 있어도 정해진 형식의 데이터를 반환한다',
      async (_, responseContent) => {
        // given
        const textContent = JSON.stringify(responseContent);
        const mockClovaResponse = createMockClovaResponse(textContent);
        mockAxios.post.mockResolvedValue(mockClovaResponse);

        // when
        const result = await newsSummaryService.summarizeNews(mockCrwalingData);

        // then
        expect(result).toBeInstanceOf(CreateStockNewsDto);
        expect(result).toEqual({
          stock_id: '005930',
          stock_name: '삼성전자',
          link: 'http://example1.com',
          title: '삼성전자 실적 호조',
          summary: '실적이 좋습니다',
          positive_content: '긍정적입니다',
          negative_content: '해당사항 없음',
        });
      },
    );
  });

  describe('클로바 뉴스 요약 실패', () => {
    // 클로바 응답 content 예시
    const contentExample = {
      stock_id: '005930',
      stock_name: '삼성전자',
      link: 'http://example1.com',
      title: '삼성전자 실적 호조',
      summary: '실적이 좋습니다',
      positive_content: '긍정적입니다',
      negative_content: '해당사항 없음',
    };

    test.each([
      ['stock_id', { ...contentExample, stock_id: undefined }],
      ['stock_name', { ...contentExample, stock_name: undefined }],
      ['link', { ...contentExample, link: undefined }],
      ['title', { ...contentExample, title: undefined }],
      ['summary', { ...contentExample, summary: undefined }],
      ['positive_content', { ...contentExample, positive_content: undefined }],
      ['negative_content', { ...contentExample, negative_content: undefined }],
    ])(
      '클로바 뉴스 요약의 필수 필드 중 %s 가 없는 경우 SummaryFieldException을 던진다',
      async (_, responseContent) => {
        // given
        const textContent = JSON.stringify(responseContent);
        const mockClovaResponse = createMockClovaResponse(textContent);
        mockAxios.post.mockResolvedValue(mockClovaResponse);

        // when & then
        await expect(
          newsSummaryService.summarizeNews(mockCrwalingData),
        ).rejects.toThrow(SummaryFieldException);
      },
    );

    test('클로바 뉴스 요약 형태가 JSON이 아닌 경우 SummaryJsonException을 던진다', async () => {
      // given
      const mockClovaResponse = createMockClovaResponse(
        '종목: 삼성전자, 제목: 실적 발표, 내용: 좋은 실적',
      );
      mockAxios.post.mockResolvedValue(mockClovaResponse);

      // when & then
      await expect(
        newsSummaryService.summarizeNews(mockCrwalingData),
      ).rejects.toThrow(SummaryJsonException);
    });

    test('뉴스 요약 API 요청이 실패하면 SummaryAPIException을 던진다', async () => {
      // given
      const mockClovaRejection = {
        response: {
          data: {
            status: {
              code: '42901',
              message: 'Too many requests - rate exceeded',
            },
          },
        },
      };
      mockAxios.post.mockRejectedValue(mockClovaRejection);
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      // when & then
      await expect(
        newsSummaryService.summarizeNews(mockCrwalingData),
      ).rejects.toThrow(SummaryAPIException);
    });
  });

  describe('클로바 토큰 계산', () => {
    test('클로바 토큰 계산이 정상적으로 완료되면 토큰 개수를 반환한다', async () => {
      // given
      const mockClovaTokenResponse = {
        data: {
          result: {
            messages: [{ count: 687 }, { count: 5000 }],
          },
        },
      };
      mockAxios.post.mockResolvedValue(mockClovaTokenResponse);

      // when
      const result = await newsSummaryService.calculateToken(mockCrwalingData);

      // then
      expect(result).toBe(5687); // 687 + 5000
    });

    test('클로바 토큰 계산 API 요청이 실패하면 TokenAPIException을 던진다', async () => {
      // given
      const mockClovaTokenRejection = {
        response: {
          data: {
            status: {
              code: '42901',
              message: 'Too many requests - rate exceeded',
            },
          },
        },
      };
      mockAxios.post.mockRejectedValue(mockClovaTokenRejection);
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      // when & then
      await expect(
        newsSummaryService.calculateToken(mockCrwalingData),
      ).rejects.toThrow(TokenAPIException);
    });
  });
});
