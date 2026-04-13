import { ApiProperty } from '@nestjs/swagger';

export class ScrapingResultDto {
  @ApiProperty({ example: 150 })
  newItems: number;

  @ApiProperty({ example: 45 })
  updatedItems?: number;

  @ApiProperty({ example: 5 })
  errors: number;

  @ApiProperty({ example: '5.23s' })
  duration: string;
}

export class ScrapingStatusDto {
  @ApiProperty({ example: 'SUCCESS' })
  status: 'SUCCESS' | 'PARTIAL' | 'PENDING';

  @ApiProperty()
  result: ScrapingResultDto;
}
