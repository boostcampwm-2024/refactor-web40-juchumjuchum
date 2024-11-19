import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class StockViewsResponse {
  @ApiProperty({
    description: '응답 메시지',
    example: 'A005930',
  })
  id: string;

  @ApiProperty({
    description: '응답 메시지',
    example: '주식 조회수가 증가되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: '응답 date',
    example: new Date(),
  })
  date: Date;

  constructor(id: string, message: string) {
    this.id = id;
    this.message = message;
    this.date = new Date();
  }
}

export class StocksResponse {
  @ApiProperty({
    description: '주식 종목 코드',
    example: 'A005930',
  })
  id: string;
  @ApiProperty({
    description: '주식 종목 이름',
    example: '삼성전자',
  })
  name: string;
  @ApiProperty({
    description: '주식 현재가',
    example: 100000.0,
  })
  @Transform(({ value }) => parseFloat(value))
  currentPrice: number;
  @ApiProperty({
    description: '주식 변동률',
    example: 2.5,
  })
  @Transform(({ value }) => parseFloat(value))
  changeRate: number;
  @ApiProperty({
    description: '주식 거래량',
    example: 500000,
  })
  @Transform(({ value }) => parseInt(value))
  volume: number;
  @ApiProperty({
    description: '주식 시가 총액',
    example: '500000000000.00',
  })
  marketCap: string;
}
