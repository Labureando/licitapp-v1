import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoadHistoricalDto {
  @ApiProperty({
    description: 'Período en formato YYYY o YYYYMM (ej: 2024, 202604)',
    example: 202604,
  })
  @IsString()
  @Matches(/^\d{4}(\d{2})?$/, {
    message: 'Period debe ser formato YYYY o YYYYMM (ej: 2024 o 202604)',
  })
  period: string;
}
