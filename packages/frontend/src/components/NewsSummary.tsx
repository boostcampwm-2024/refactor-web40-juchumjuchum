interface NewsSummaryProps {
  positive_content_summary: string | null;
  negative_content_summary: string | null;
}

export const NewsSummary = ({
  positive_content_summary,
  negative_content_summary,
}: NewsSummaryProps) => {
  return (
    <div className="text-sm space-y-2">
      {/* AI Beta 배지 */}
      <div className="mb-2">
        <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-1 text-sm font-bold text-green shadow-md">
          <span className="mr-1 text-lg">⚡</span> AI Beta
        </span>
      </div>

      {/* 호재가 있는 경우에만 렌더링 */}
      {positive_content_summary && positive_content_summary !== '해당사항 없음' && (
        <div>
          <span className="font-semibold" style={{ color: '#dc2626' }}>호재:</span>{' '}
          <span className="text-dark-gray">: {positive_content_summary}</span>
        </div>
      )}

      {/* 악재가 있는 경우에만 렌더링 */}
      {negative_content_summary && negative_content_summary !== '해당사항 없음' && (
        <div>
          <span className="font-semibold" style={{ color: '#2563eb' }}>악재:</span>{' '}
          <span className="text-dark-gray">: {negative_content_summary}</span>
        </div>
      )}
    </div>
  );
}; 