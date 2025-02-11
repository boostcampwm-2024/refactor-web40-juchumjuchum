import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { Logger } from 'winston';
import { CreateStockNewsDto } from './dto/stockNews.dto';
import { CrawlingDataDto } from '@/news/dto/crawlingData.dto';

@Injectable()
export class NewsSummaryService {
  private readonly CLOVA_API_URL =
    'https://clovastudio.stream.ntruss.com/testapp/v1/chat-completions/HCX-003';
  private readonly CLOVA_TOKEN_URL =
    'https://clovastudio.stream.ntruss.com/v1/api-tools/chat-tokenize/HCX-003';
  private readonly CLOVA_API_KEY = process.env.CLOVA_API_KEY;

  constructor(@Inject('winston') private readonly logger: Logger) {}

  async summarizeNews(stockNewsData: CrawlingDataDto) {
    try {
      const clovaResponse = await axios.post(
        this.CLOVA_API_URL,
        {
          ...this.getRequestMessages(stockNewsData),
          ...this.getParameters(),
        },
        {
          headers: this.getHeaders(),
        },
      );

      const content = this.verfiyClovaResponse(clovaResponse);
      if (!content) {
        return null;
      }

      const summarizedNews = new CreateStockNewsDto();
      summarizedNews.stock_id = content.stock_id;
      summarizedNews.stock_name = content.stock_name;
      summarizedNews.link = content.link;
      summarizedNews.title = content.title;
      summarizedNews.summary = content.summary;
      summarizedNews.positive_content = content.positive_content;
      summarizedNews.negative_content = content.negative_content;

      return summarizedNews;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Failed to summarize news: status=${error.response?.data?.status?.code}, data=${error.response?.data?.status?.message}`,
        );
      } else {
        this.logger.error('Unknown Error', error);
      }
    }
  }

  async calculateToken(stockNewsData: CrawlingDataDto) {
    try {
      const clovaTokenResponse = await axios.post(
        this.CLOVA_TOKEN_URL,
        this.getRequestMessages(stockNewsData),
        {
          headers: this.getHeaders(),
        },
      );

      const messages = clovaTokenResponse.data.result.messages;
      const totalToken = messages.reduce((acc: number, message: any) => {
        return acc + message.count;
      }, 0);

      this.logger.info(`token length: ${totalToken}`);

      return totalToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Failed to calculate token: status=${error.response?.data?.status?.code}, data=${error.response?.data?.status?.message}`,
        );
      } else {
        this.logger.error('Unknown Error', error);
      }
    }
  }

  private getRequestMessages(stockNewsData: CrawlingDataDto) {
    return {
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: JSON.stringify(stockNewsData),
        },
      ],
    };
  }

  private getSystemPrompt() {
    return `당신은 AI 기반 주식 분석 전문가입니다. 입력으로 주어지는 JSON 형식의 뉴스 데이터를 분석하여, JSON 형식으로 종합적인 분석 결과를 도출해 주세요.

    [입력 형식]
    {
      "stock_name": "종목 이름",
      "news": [
        {
          "date": "기사 날짜",
          "title": "기사 제목",
          "content": "기사 내용",
          "url": "기사 링크"
        },
        ...
      ]
    }
    
    [출력 형식]
    {
      "stock_id": "종목 번호",
      "stock_name": "종목 이름",
      "link": "기사 링크들",
      "title": "요약 타이틀",
      "summary": "요약 내용",
      "positive_content": "긍정적 측면",
      "negative_content": "부정적 측면"
    }
    
    [분석 지침]
    분석해야 할 항목은 다음과 같습니다:
    
    1. **종목 정보:**
       - stock_name을 기반으로 해당 종목의 stock_id를 찾아 포함
       - 제공된 모든 뉴스의 url을 쉼표로 구분하여 link 필드에 포함
    
    2. **종합 분석:**
       - title: 전체 뉴스 내용을 관통하는 핵심 주제나 이슈를 간단한 제목으로 작성
       - summary: 모든 뉴스 기사의 주요 내용을 종합적으로 요약하여 작성
    
    3. **영향 분석:**
       - positive_content: 기업, 산업, 경제에 긍정적 영향을 줄 수 있는 요소들을 분석하여 작성
       - negative_content: 위험 요소나 부정적 영향을 줄 수 있는 요소들을 분석하여 작성
    
    [제약 사항]
    1. 모든 뉴스 기사의 내용을 종합적으로 고려하여 분석합니다.
    2. positive_content 와 negative_content 내용이 없는 경우 "해당사항 없음"으로 작성합니다.
    3. 요약과 분석은 객관적이고 사실에 기반하여 작성합니다.
    4. 특정 종목의 stock_id를 모르는 경우 빈 문자열("")을 반환합니다.
    5. 반드시 JSON 형식으로만 응답하며, 다른 어떤 텍스트도 포함하지 않습니다.
    6. JSON 응답 전후에 어떠한 설명이나 부가 텍스트를 추가하지 않습니다.
    7. JSON의 각 필드는 큰따옴표(")로 묶어야 합니다.
    8. 응답은 단일 JSON 객체여야 하며, 최상위 레벨에 다른 텍스트가 있으면 안 됩니다.
    
    [응답 예시]
    {
      "stock_id": "035720",
      "stock_name": "카카오",
      "link": "http://example1.com, http://example2.com",
      "title": "카카오 실적 발표",
      "summary": "실적 내용 요약...",
      "positive_content": "긍정적 내용...",
      "negative_content": "해당사항 없음"
    }`;
  }

  private getParameters() {
    return {
      topP: 0.8,
      topK: 0,
      maxTokens: 500,
      temperature: 0.5,
      repeatPenalty: 5.0,
      stopBefore: [],
      includeAiFilters: true,
      seed: 0,
    };
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.CLOVA_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  private verfiyClovaResponse(response: any) {
    try {
      const content = response.data.result.message.content;
      this.logger.info(`Summarized news: ${content}`);

      const parsedContent = JSON.parse(content);
      const fixedContent = this.fixFieldNames(parsedContent);
    
      if (!('stock_id' in fixedContent) || !('stock_name' in fixedContent)) {
        this.logger.error('Response is missing required fields: stock_id, stock_name');
        return null;
      }

      return fixedContent;
    } catch (error) {
      this.logger.error('Failed to parse clova response', error);
      return null;
    }
  }

  private fixFieldNames(content: any) {
    const fieldMappings: Record<string, string> = {
      'stockId': 'stock_id',
      'stockName': 'stock_name',
    };

    return Object.keys(content).reduce((acc: any, key: string) => {
      const fixedKey = fieldMappings[key] || key;
      acc[fixedKey] = content[key];
      return acc;
    }, {});
  }
}
