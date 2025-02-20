import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { dynamicImport } from 'tsimportlib';
import { Logger } from 'winston';
import { CreateStockNewsDto } from './dto/stockNews.dto';
import {
  SummaryFieldException,
  SummaryJsonException,
  SummaryAPIException,
  TokenAPIException,
} from './error/newsSummary.error';
import { CrawlingDataDto } from '@/news/dto/crawlingData.dto';
import { StockNewsRepository } from '@/news/stockNews.repository';

@Injectable()
export class NewsSummaryService {
  private readonly CLOVA_API_URL =
    'https://clovastudio.stream.ntruss.com/testapp/v1/chat-completions/HCX-003';
  private readonly CLOVA_TOKEN_URL =
    'https://clovastudio.stream.ntruss.com/v1/api-tools/chat-tokenize/HCX-003';
  private readonly CLOVA_API_KEY = process.env.CLOVA_API_KEY;
  public readonly NEWS_TITLE_SPERATOR = '|';
  private transformers: any;

  constructor(@Inject('winston') private readonly logger: Logger,
              private readonly stockNewsRepository: StockNewsRepository) {
    this.initializeTransformer().then(() => this.transformers);
  }

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

      const summarizedNews = this.convertClovaResponseToDto(clovaResponse, stockNewsData);

      return summarizedNews;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new SummaryAPIException(
          `${JSON.stringify(error.response?.data ?? error.message)}`,
          error,
        );
      }
      throw error;
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

      const messages = clovaTokenResponse.data.result?.messages;
      if (!messages || !Array.isArray(messages)) {
        throw new TokenAPIException('Invalid clova token response format');
      }

      const totalToken = messages.reduce((acc: number, message: any): number => {
        if (typeof message.count !== 'number') {
          throw new TokenAPIException('Invalid clova token count format');
        }
        return acc + message.count;
      }, 0);

      this.logger.info(`token length: ${totalToken}`);

      return totalToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new TokenAPIException(
          `${JSON.stringify(error.response?.data ?? error.message)}`,
          error,
        );
      }
      throw error;
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

    [응답 형식 검증]
    응답은 반드시 다음 9개의 필드를 모두 포함해야 합니다:
    1. stock_id: 종목 번호 (필수)
    2. stock_name: 종목 이름 (필수)
    3. link: 기사 링크들 (필수)
    4. title: 요약 제목 (필수)
    5. summary: 뉴스 영향 요약, 15자 이내 (필수)
    6. positive_content: 긍정적 영향 상세 내용 (필수)
    7. negative_content: 부정적 영향 상세 내용 (필수)
    8. positive_content_summary: 긍정적 영향 요약, 15자 이내 (필수)
      * 형식: "핵심내용 으로 인한 주가 상승 방향"
      * 예시: "자사주 매입으로 인한 주가 상승 예상"
    9. negative_content_summary: 부정적 영향 요약, 15자 이내 (필수)
      * 형식: "핵심내용 으로 인한 주가 하락 방향"
      * 예시: "일론 머스크 CEO 사임으로 인한 주가 하락 예상"
    
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
      "negative_content": "부정적 측면",
      "positive_content_summary": "긍정적 측면 요약",
        * 형식: "핵심내용 으로 인한 주가 상승 방향"
        * 예시: "자사주 매입으로 인한 주가 상승 예상"
      "negative_content_summary": "부정적 측면 요약"
        * 형식: "핵심내용 으로 인한 주가 하락 방향"
        * 예시: "일론 머스크 CEO 사임으로 인한 주가 하락 예상"
    }
    
    [분석 지침]
    분석해야 할 항목은 다음과 같습니다:
    
    1. **종목 정보:**
       - stock_name을 기반으로 해당 종목의 stock_id를 찾아 포함
       - 제공된 모든 뉴스의 url을 쉼표로 구분하여 link 필드에 포함
    
    2. **종합 분석:**
       - title: 전체 뉴스 내용을 관통하는 핵심 주제나 이슈를 간단한 제목으로 작성
       - summary: 모든 뉴스 기사의 주요 내용을 종합적으로 요약하여 작성
       - positive_content_summary: 뉴스가 주가에 미칠 긍정적 영향을 15자 이내로 작성
       - negative_content_summary: 뉴스가 주가에 미칠 부정적 영향을 15자 이내로 작성
         * 형식: "핵심내용 으로 인한 주가방향"
         * 예시: "자사주 매입으로 인한 주가 상승 예상"
         * 예시: "일론 머스크 CEO 사임으로 인한 주가 하락 예상"
    
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
    9. positive_content_summary 와 negative_content_summary 내용이 없는 경우 "해당사항 없음"으로 작성합니다.
    
    [응답 예시]
    {
      "stock_id": "035720",
      "stock_name": "카카오",
      "link": "http://example1.com, http://example2.com",
      "title": "카카오 실적 발표",
      "summary": "실적 내용 요약...",
      "positive_content": "긍정적 내용...",
      "negative_content": "해당사항 없음"
      "positive_content_summary": "자사주 매입으로 인한 주가 상승 예상",
      "negative_content_summary": "해당사항 없음"
    }
    
    [중요]
    - 모든 필드는 필수이며 생략할 수 없습니다
    - 응답 위에 다른 객체로 감싸지 않아야 합니다
    - 형식이 맞지 않으면 시스템 오류가 발생합니다
    - "해당사항 없음"의 경우에도 명시적으로 작성해야 합니다\`;
    - positive_content_summary, negative_content_summary는 단순 사실이나 예측이 아닌, 명확한 인과관계를 보여야 합니다.\`;
      * 금지 예시 : 주가 상승(x)
      * 올바른 예시 : 자사주 매입으로 인한 주가 상승 예상(o)\
    `;
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

  private async convertClovaResponseToDto(response: any, stockNewsData: CrawlingDataDto) {
    try {
      const content = response.data.result.message.content;
      this.logger.info(`Summarized news: ${content}`);

      const parsedContent = JSON.parse(content);
      const fixedContent = this.fixFieldNames(parsedContent);
      const customizedContent = this.addCustomFields(fixedContent, stockNewsData);

      const summarizedNews = plainToInstance(CreateStockNewsDto, customizedContent);
      await validateOrReject(summarizedNews);

      return summarizedNews;
    } catch (error) {
      if (Array.isArray(error)) {
        throw new SummaryFieldException(`${JSON.stringify(error, null, 2)}`, error);
      }
      throw new SummaryJsonException('Invalid JSON', error);
    }
  }

  private addCustomFields(content: any, stockNewsData: CrawlingDataDto) {
    return {
      ...content,
      link_titles: stockNewsData.news.map((n) => n.title).join(this.NEWS_TITLE_SPERATOR),
    };
  }

  private fixFieldNames(content: any) {
    const fieldMappings: Record<string, string> = {
      stockid: 'stock_id',
      stockname: 'stock_name',
      link: 'link',
      title: 'title',
      summary: 'summary',
      positivecontent: 'positive_content',
      negativecontent: 'negative_content',
      positivecontentsummary: 'positive_content_summary',
      negativecontentsummary: 'negative_content_summary'
    };

    return Object.keys(content).reduce((acc: any, key: string) => {
      const lowKey = key.toLowerCase();
      const fixedKey = fieldMappings[lowKey] || key;
      acc[fixedKey] = content[key];
      return acc;
    }, {});
  }

  async getLatestNewSummary(stockId: string) {
    const latestNews =
      await this.stockNewsRepository.findLatestByStockId(stockId);
    return latestNews?.summary;
  }

  async compareSummary(content: string, stockId: string) {
    const latestNewsContent = await this.getLatestNewSummary(stockId);
    const extractor = await this.transformers.pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
    );

    const summaryResponse = await extractor([content], {
      pooling: 'mean',
      normalize: true,
    });

    const latestSummaryResponse = await extractor([latestNewsContent], {
      pooling: 'mean',
      normalize: true,
    });


    return await this.cos_sim(
      Array.from(summaryResponse.data),
      Array.from(latestSummaryResponse.data),
    );
  }

  private async initializeTransformer() {
    try {
      if (!this.transformers) {
        this.transformers = (await dynamicImport(
          '@xenova/transformers',
          module,
        )) as typeof import('@xenova/transformers');
      }
    } catch (err) {
      this.logger.error('Failed to initialize transformer:', err);
      throw err;
    }
  }

  async cos_sim(vector1: number[], vector2: number[]) {
    if (vector1.length !== vector2.length) {
      throw new Error('Vector haven\'t same length');
    }

    const dotProduct = vector1.reduce(
      (sum, val, idx) => sum + val * vector2[idx],
      0,
    );
    const size1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0.0));
    const size2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0.0));

    return size1 && size2 ? dotProduct / (size1 * size2) : 0.0;
  }


}


