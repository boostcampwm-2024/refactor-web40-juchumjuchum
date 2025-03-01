import { ApiProperty } from '@nestjs/swagger';

export class AlarmRequest {
  @ApiProperty({
    description: '주식 아이디',
    example: '005930',
  })
  stockId: string;

  @ApiProperty({
    description: '목표 가격',
    example: 100000,
    required: false,
  })
  targetPrice?: number;

  @ApiProperty({
    description: '목표 거래량',
    example: 1000000000,
    required: false,
  })
  targetVolume?: number;

  @ApiProperty({
    description: '알림 종료 날짜',
    example: '2026-12-01T00:00:00Z',
    required: false,
  })
  alarmExpiredDate?: Date;
}
