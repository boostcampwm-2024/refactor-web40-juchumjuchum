import { cn } from '@/utils/cn';

interface StockInfoCardProps {
  index?: number;
  name?: string;
  currentPrice?: number;
  changeRate?: number;
  news?: {
    positive_content_summary: string | null;
    negative_content_summary: string | null;
  };
  onClick?: () => void;
}

export const StockInfoCard = ({
  name,
  currentPrice,
  changeRate = 0,
  index = 0,
  news,
  onClick,
}: StockInfoCardProps) => {
  console.log('StockInfoCard props:', { name, currentPrice, changeRate, index, news });

  return (
    <div
      className={cn(
        'flex cursor-pointer flex-col gap-2 rounded-md p-5 shadow transition-all duration-300 hover:scale-105 2xl:py-4 2xl:pl-5 2xl:pr-16',
        index === 0 ? 'bg-light-yellow' : 'bg-white',
      )}
      onClick={onClick}
    >
      <p className="display-bold16 text-dark-gray mb-3">{name}</p>
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-5">
          <span className="display-bold12 text-dark-gray">등락률</span>
          <span
            className={cn(
              'xl:display-bold16 display-bold12',
              changeRate >= 0 ? 'text-red' : 'text-blue',
            )}
          >
            {changeRate}%
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="display-bold12 text-dark-gray">현재가</span>
          <span className="display-medium12 text-dark-gray">
            {currentPrice?.toLocaleString()}원
          </span>
        </div>
      </section>
      {news && (
        <section className="mt-2 text-sm">
          {/* 호재가 있는 경우에만 렌더링 */}
          {news.positive_content_summary && news.positive_content_summary !== '해당사항 없음' && (
            <div className="text-dark-gray">
              <span className="font-semibold" style={{ color: '#dc2626' }}>호재:</span>{' '}
              {news.positive_content_summary}
            </div>
          )}

          {/* 악재가 있는 경우에만 렌더링 */}
          {news.negative_content_summary && news.negative_content_summary !== '해당사항 없음' && (
            <div className="text-blue-600">
              <span className="font-semibold" style={{ color: '#2563eb' }}>악재:</span>{' '}
              {news.negative_content_summary}
            </div>
          )}
        </section>
      )}
    </div>
  );
};