import React from 'react';

const StockInfoCard = ({ index, name, currentPrice, changeRate, news }) => {
  return (
    <div className="stock-card">
      <h3>{name}</h3>
      <p>현재가: {currentPrice}원</p>
      <p>변동률: {changeRate}%</p>
      {news && (
        <div className="news-section">
          <p>호재: {news.positive_content || '없음'}</p>
          <p>악재: {news.negative_content || '없음'}</p>
        </div>
      )}
    </div>
  );
};

export default StockInfoCard; 