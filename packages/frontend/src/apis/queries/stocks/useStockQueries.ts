import { useSuspenseQueries } from '@tanstack/react-query';
import { z } from 'zod';
import {
  GetStockListRequest,
  GetStockListResponseSchema,
  GetStockTopViewsResponse,
  StockIndexResponse,
  StockIndexSchema,
} from './schema';
import { get } from '@/apis/utils/get';

interface StockQueriesProps {
  viewsLimit: GetStockListRequest['limit'];
}

const getStockIndex = () =>
  get<StockIndexResponse[]>({
    schema: z.array(StockIndexSchema),
    url: `/api/stock/index`,
  });

const getTopViews = ({ limit }: Partial<GetStockListRequest>) =>
  get<Partial<GetStockTopViewsResponse>[]>({
    schema: z.array(GetStockListResponseSchema.partial()),
    url: `/api/stock/top`,
    params: {
      sortBy: 'views',
      limit: limit,
    },
  });

const getTopMarketCap = ({ limit }: Partial<GetStockListRequest>) =>
  get<Partial<GetStockTopViewsResponse>[]>({
    schema: z.array(GetStockListResponseSchema.partial()),
    url: `/api/stock/top`,
    params: {
      sortBy: 'marketCap',
      limit: 10,
    },
  });

// 뉴스 응답 스키마 수정
const NewsItemSchema = z.object({
  createdAt: z.string(),
  link: z.string(),
  negativeContent: z.string(),
  positiveContent: z.string(),
  stockId: z.string(),
  stockName: z.string(),
  summary: z.string(),
  title: z.string(),
});

const NewsResponseSchema = z.array(NewsItemSchema);

const getStockNews = (stockId: string) =>
  get<Array<{
    createdAt: string;
    link: string;
    negativeContent: string;
    positiveContent: string;
    stockId: string;
    stockName: string;
    summary: string;
    title: string;
  }>>({
    schema: NewsResponseSchema,
    url: `/api/stock/news/${stockId}`,
  });

export const useStockQueries = ({ viewsLimit }: StockQueriesProps) => {
  return useSuspenseQueries({
    queries: [
      {
        queryKey: ['stockIndex'],
        queryFn: getStockIndex,
      },
      {
        queryKey: ['topMarketCap'],
        queryFn: async () => {
          const stocks = await getTopMarketCap({ limit: viewsLimit });
          
          // 각 주식에 대한 뉴스 데이터 요청
          const stocksWithNews = await Promise.all(
            stocks.map(async (stock) => {
              if (!stock.id) return stock;
              
              try {
                const newsData = await getStockNews(stock.id);
                const latestNews = newsData[0];
                return {
                  ...stock,
                  news: {
                    positive_content: latestNews?.positiveContent === '해당사항 없음' ? null : latestNews?.positiveContent,
                    negative_content: latestNews?.negativeContent === '해당사항 없음' ? null : latestNews?.negativeContent,
                  },
                };
              } catch (error) {
                console.error(`Failed to fetch news for stock ${stock.id}:`, error);
                return {
                  ...stock,
                  news: {
                    positive_content: null,
                    negative_content: null,
                  },
                };
              }
            })
          );
          
          return stocksWithNews;
        },
      },
    ],
  });
};