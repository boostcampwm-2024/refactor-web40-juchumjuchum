import { formatDateToYYYYMMDD } from '@/utils/formatDate';
import { useState } from 'react';

interface NewsButtonProps {
  stockId: string;
  stockName: string;
}

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const NewsButton = ({ stockId, stockName }: NewsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [news, setNews] = useState<any[]>([]);

  const handleClick = async () => {
    try {
      setIsOpen(true);
      const response = await fetch(`${BASE_URL}/api/stock/news/${stockId}`);
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('뉴스를 불러오는데 실패했습니다:', error);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md active:scale-95"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
        AI 뉴스 보기
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={handleOverlayClick}
        >
          <div className="border-gray relative max-h-[80vh] w-full max-w-xl overflow-auto rounded-lg border-[1px] bg-white pb-4 pl-4 pr-4">
            <div className="sticky top-0 mb-4 flex items-center justify-between bg-white pb-2 pl-2 pr-2 pt-6">
              <h2 className="text-lg font-bold">{stockName} 뉴스</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {news.map((item, index) => (
                <>
                  <div className="font-semibold">{formatDateToYYYYMMDD(item.createdAt)}</div>
                  <div
                    key={index}
                    className="m-1 rounded-lg border p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="text-lg font-bold">{item.title}</div>
                    <div className="mt-2">{item.summary}</div>
                    {item.positiveContent && (
                      <div className="mt-2 rounded p-2">
                        <span className="text-positive-red">긍정:</span> {item.positiveContent}
                      </div>
                    )}
                    {item.negativeContent && (
                      <div className="mt-2 rounded p-2">
                        <span className="text-negative-blue">부정:</span> {item.negativeContent}
                      </div>
                    )}
                    <div className="mt-3 space-y-1">
                      {item.link.split(',').map((link: string, i: number) => (
                        <a
                          key={i}
                          href={link.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-primary block hover:underline"
                        >
                          {item.linkTitles.split('|')[i] || `뉴스 링크 ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              ))}
            </div>

            {news.length === 0 && (
              <div className="py-8 text-center text-gray-500">뉴스가 없습니다</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
