interface NewsSummaryProps {
  positive_content_summary: string | null;
  negative_content_summary: string | null;
}

export const NewsSummary = ({
  positive_content_summary,
  negative_content_summary,
}: NewsSummaryProps) => {
  return (
    <div className="space-y-2 text-sm">
      {/* AI Beta 배지 */}
      <div className="mb-0">
        <span className="badge-ai-beta">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#fbbf24"
            viewBox="0 0 24 24"
            strokeWidth={1.2}
            stroke="#fbbf24"
            className="size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
            />
          </svg>
          AI Beta
        </span>
      </div>

      {/* 호재가 있는 경우에만 렌더링 */}
      {positive_content_summary && positive_content_summary !== '해당사항 없음' && (
        <div>
          <span className="text-positive-red font-semibold">호재:</span>{' '}
          <span className="text-dark-gray"> {positive_content_summary}</span>
        </div>
      )}

      {/* 악재가 있는 경우에만 렌더링 */}
      {negative_content_summary && negative_content_summary !== '해당사항 없음' && (
        <div>
          <span className="text-negative-blue font-semibold">악재:</span>{' '}
          <span className="text-dark-gray"> {negative_content_summary}</span>
        </div>
      )}
    </div>
  );
};
